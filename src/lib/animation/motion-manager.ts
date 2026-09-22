import { gsap } from 'gsap';
import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export interface MotionState {
  mouse: { x: number; y: number; velocityX: number; velocityY: number };
  scroll: { y: number; velocity: number; direction: -1 | 0 | 1; progress: number };
  viewport: { width: number; height: number };
  isTouch: boolean;
  reducedMotion: boolean;
}
export type FrameCallback = (time: number, delta: number) => void;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** All consumers use GSAP's clock. Pointer Y follows WebGL (+1 at top). */
export class MotionManager {
  readonly state: MotionState;
  private frames = new Set<FrameCallback>();
  private preferences = new Set<() => void>();
  private removers: (() => void)[] = [];
  private lenis?: Lenis;
  private maxScroll = 1;
  private lastMouse = { x: 0, y: 0 };
  private lastScroll = 0;
  private destroyed = false;

  constructor() {
    this.state = {
      mouse: { x: 0, y: 0, velocityX: 0, velocityY: 0 },
      scroll: { y: window.scrollY, velocity: 0, direction: 0, progress: 0 },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      isTouch: window.matchMedia('(pointer: coarse)').matches,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
    this.lastScroll = window.scrollY;
    this.measure();
    this.listen(window, 'resize', this.measure);
    this.listen(window, 'scroll', this.scroll);
    this.listen(window, 'pointermove', this.pointer);
    this.listen(document, 'visibilitychange', this.visibility);
    for (const query of ['(pointer: coarse)', '(prefers-reduced-motion: reduce)']) {
      this.listen(window.matchMedia(query), 'change', this.updatePreferences);
    }
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(this.measure);
      observer.observe(document.documentElement);
      this.removers.push(() => observer.disconnect());
    }
    this.configureScroll();
    if (!document.hidden) gsap.ticker.add(this.tick);
  }
  private configureScroll = () => {
    this.lenis?.destroy(); this.lenis = undefined;
    if (!this.state.isTouch && !this.state.reducedMotion) {
      this.lenis = new Lenis({ autoRaf: false, smoothWheel: true, syncTouch: false, anchors: true });
      this.lenis.on('scroll', ScrollTrigger.update);
      if (document.hidden) this.lenis.stop();
    }
  };
  private updatePreferences = () => {
    this.state.isTouch = window.matchMedia('(pointer: coarse)').matches;
    this.state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.configureScroll();
    for (const callback of this.preferences) callback();
  };
  private visibility = () => {
    if (document.hidden) {
      gsap.ticker.remove(this.tick); this.lenis?.stop();
    } else if (!this.destroyed) {
      this.lastMouse = { x: this.state.mouse.x, y: this.state.mouse.y };
      this.lastScroll = this.state.scroll.y;
      this.state.mouse.velocityX = this.state.mouse.velocityY = this.state.scroll.velocity = 0;
      this.lenis?.start(); gsap.ticker.add(this.tick);
    }
  };
  onPreferencesChange(callback: () => void): () => void {
    if (!this.destroyed) this.preferences.add(callback);
    return () => { this.preferences.delete(callback); };
  }
  private listen(target: EventTarget, event: string, fn: EventListener) {
    target.addEventListener(event, fn, { passive: true });
    this.removers.push(() => target.removeEventListener(event, fn));
  }
  private measure = () => {
    this.state.viewport.width = window.innerWidth;
    this.state.viewport.height = window.innerHeight;
    this.maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    this.scroll();
  };
  private scroll = () => {
    this.state.scroll.y = window.scrollY;
    this.state.scroll.progress = clamp(window.scrollY / this.maxScroll, 0, 1);
  };
  private pointer = (event: Event) => {
    const e = event as PointerEvent;
    this.state.mouse.x = clamp(e.clientX / Math.max(1, this.state.viewport.width) * 2 - 1, -1, 1);
    this.state.mouse.y = clamp(1 - e.clientY / Math.max(1, this.state.viewport.height) * 2, -1, 1);
  };
  private tick = (time: number, deltaMs: number) => {
    if (this.destroyed || document.hidden) return;
    const delta = clamp(deltaMs / 1000, 0.001, 0.05);
    this.lenis?.raf(time * 1000);
    const { mouse, scroll } = this.state;
    const dx = mouse.x - this.lastMouse.x, dy = mouse.y - this.lastMouse.y;
    const ds = scroll.y - this.lastScroll;
    const decay = Math.exp(-12 * delta);
    mouse.velocityX = dx ? dx / delta : mouse.velocityX * decay;
    mouse.velocityY = dy ? dy / delta : mouse.velocityY * decay;
    scroll.velocity = ds ? ds / delta : scroll.velocity * decay;
    if (ds) scroll.direction = ds > 0 ? 1 : -1;
    this.lastMouse.x = mouse.x; this.lastMouse.y = mouse.y; this.lastScroll = scroll.y;
    for (const callback of this.frames) callback(time, delta);
  };
  onFrame(callback: FrameCallback): () => void {
    if (!this.destroyed) this.frames.add(callback);
    return () => { this.frames.delete(callback); };
  }
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    gsap.ticker.remove(this.tick);
    this.lenis?.destroy();
    this.frames.clear();
    this.preferences.clear();
    this.removers.splice(0).reverse().forEach(remove => remove());
  }
}
