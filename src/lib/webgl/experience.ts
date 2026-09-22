import { ACESFilmicToneMapping, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer } from 'three';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { MotionManager } from '../animation/motion-manager';
import { clamp, damp, renderBudget, sceneProgress, type SectionBounds } from './core';
import { createReactor } from './reactor';
import { ImageGallery } from './gallery';

let active: (() => void) | undefined;
const noop = () => {};

/** Lazy import this module; no renderer or animation clock exists at module scope. */
export async function initWebGL(motion: MotionManager): Promise<() => void> {
  if (typeof document === 'undefined') return noop;
  active?.();
  const canvas = document.querySelector<HTMLCanvasElement>('#webgl-canvas');
  document.documentElement.dataset.webgl = 'unavailable';
  if (canvas) canvas.style.visibility = 'hidden';
  if (!canvas || motion.state.reducedMotion) return noop;
  const hasScene = Boolean(
    document.querySelector('#hero') ||
    document.querySelector('#contact') ||
    document.querySelector('img[data-webgl-image], [data-webgl-image] img'),
  );
  if (!hasScene) return noop;
  let experience: WebGLExperience | undefined;
  let renderer: WebGLRenderer | undefined;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: !motion.state.isTouch,
      powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false });
    experience = new WebGLExperience(renderer, canvas, motion);
    experience.start();
    if (experience.failed) { experience.dispose(); return noop; }
    const cleanup = () => {
      experience?.dispose();
      if (active === cleanup) active = undefined;
    };
    active = cleanup;
    return cleanup;
  } catch {
    if (experience) experience.dispose();
    else renderer?.dispose();
    canvas.style.visibility = 'hidden';
    document.documentElement.dataset.webgl = 'unavailable';
    return noop;
  }
}

/** One renderer, one shared MotionManager subscription, two complementary scenes. */
class WebGLExperience {
  failed = false;
  private disposed = false;
  private scene = new Scene();
  private camera = new PerspectiveCamera(42, 1, .1, 40);
  private reactor?: ReturnType<typeof createReactor>;
  private gallery?: ImageGallery;
  private removers: (() => void)[] = [];
  private visible = new Set<Element>();
  private targets: Element[] = [];
  private hero: Element | null = null;
  private manifesto: Element | null = null;
  private contact: Element | null = null;
  private sections: SectionBounds = { heroTop: 0, heroHeight: 1, manifestoTop: 1, contactTop: Infinity };
  private observer?: IntersectionObserver;
  private unsubscribe = noop;
  private shaderFailed = false;
  private hasRendered = false;

  constructor(private renderer: WebGLRenderer, private canvas: HTMLCanvasElement, private motion: MotionManager) {}

  start() {
    const { state } = this.motion;
    const budget = renderBudget(state.isTouch, window.devicePixelRatio);
    Object.assign(this.canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '1' });
    this.canvas.setAttribute('aria-hidden', 'true');
    this.renderer.setPixelRatio(budget.dpr);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.autoClear = false;
    this.renderer.debug.onShaderError = () => { this.shaderFailed = true; };
    this.camera.position.z = 7.4;
    this.hero = document.querySelector('#hero');
    this.manifesto = document.querySelector('#manifesto');
    this.contact = document.querySelector('#contact');
    const images = [...document.querySelectorAll<HTMLImageElement>('img[data-webgl-image], [data-webgl-image] img')];
    this.targets = [...new Set([this.hero, this.manifesto, this.contact, ...images].filter((e): e is Element => !!e))];
    if (this.hero || this.contact) {
      this.reactor = createReactor(budget.particles, budget.segments, budget.dpr);
      this.scene.add(this.reactor.group);
    }
    this.gallery = new ImageGallery(images);
    this.listen(this.canvas, 'webglcontextlost', (event) => { event.preventDefault(); this.fail(); });
    this.listen(window, 'resize', this.measure);
    this.listen(document, 'webgl:refresh', this.measure);
    this.listen(document, 'astro:before-swap', () => this.dispose());
    this.listen(document, 'visibilitychange', () => {
      if (document.hidden) this.canvas.style.visibility = 'hidden';
    });
    ScrollTrigger.addEventListener('refresh', this.measure);
    this.removers.push(() => ScrollTrigger.removeEventListener('refresh', this.measure));
    this.measure();
    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) this.visible.add(entry.target);
          else this.visible.delete(entry.target);
        });
      }, { rootMargin: '80px 0px', threshold: 0 });
      this.targets.forEach(target => this.observer!.observe(target));
    }
    // Fonts and decoded image dimensions may settle after the initial layout pass.
    void document.fonts?.ready.then(() => { if (!this.disposed) this.measure(); });
    void this.gallery.ready.then(() => { if (!this.disposed) this.measure(); });
    this.unsubscribe = this.motion.onFrame(this.frame);
    this.frame(0, 1 / 60);
  }

  private listen(target: EventTarget, event: string, handler: EventListener) {
    target.addEventListener(event, handler);
    this.removers.push(() => target.removeEventListener(event, handler));
  }

  private measure = () => {
    if (this.disposed) return;
    const { viewport, scroll } = this.motion.state;
    const width = Math.max(1, viewport.width), height = Math.max(1, viewport.height);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    const rects = new Map(this.targets.map(target => [target, target.getBoundingClientRect()]));
    this.visible.clear();
    rects.forEach((rect, target) => { if (rect.top < height + 80 && rect.bottom > -80) this.visible.add(target); });
    const hero = this.hero ? rects.get(this.hero) : undefined;
    const manifesto = this.manifesto ? rects.get(this.manifesto) : undefined;
    const contact = this.contact ? rects.get(this.contact) : undefined;
    this.sections = { heroTop: hero ? hero.top + scroll.y : 0, heroHeight: hero?.height || height,
      manifestoTop: manifesto ? manifesto.top + scroll.y : height,
      contactTop: contact ? contact.top + scroll.y : Infinity };
    this.gallery?.measure(scroll.y);
  };

  private frame = (time: number, delta: number) => {
    if (this.disposed || document.hidden) return;
    const { state } = this.motion;
    const compactViewport = state.isTouch || state.viewport.width < 768;
    if (state.reducedMotion) { this.fail(); return; }
    if (!this.visible.size) { this.canvas.style.visibility = 'hidden'; return; }
    const dt = clamp(delta, 0, .05);
    const imageCount = this.gallery?.update(state, dt, time) ?? 0;
    const reactorVisible = !!this.reactor && [this.hero, this.manifesto, this.contact].some(target => target && this.visible.has(target));
    if (!imageCount && !reactorVisible) { this.canvas.style.visibility = 'hidden'; return; }
    try {
      this.renderer.clear();
      // Image-only frames sit above opaque editorial panels; never cover their text.
      // The canvas returns to z=1 for the hero/manifesto/contact composition.
      this.canvas.style.zIndex = imageCount ? '3' : '1';
      if (reactorVisible && !imageCount && this.reactor) {
        const { dissolve, regroup } = sceneProgress(state.scroll.y, state.viewport.height, this.sections);
        this.reactor.update(time, dt, dissolve, regroup, state.mouse);
        this.camera.position.x = damp(this.camera.position.x, state.mouse.x * .10, 2, dt);
        this.camera.position.y = damp(this.camera.position.y, state.mouse.y * .075, 2, dt);
        this.camera.position.z = damp(this.camera.position.z, 7.4 - dissolve * .65, 2, dt);
        this.camera.lookAt(0, 0, 0);
        const worldHeight = 2 * Math.tan(this.camera.fov * Math.PI / 360) * this.camera.position.z;
        const worldWidth = worldHeight * this.camera.aspect;
        // Right-side composition protects the left-aligned professional identity.
        // Mobile keeps the reactor as a peripheral signal so the identity remains
        // the first readable layer instead of turning the scene into wallpaper.
        this.reactor.group.position.set(
          worldWidth * (compactViewport ? .46 : .22),
          worldHeight * (compactViewport ? -.14 : .05),
          0,
        );
        this.reactor.group.scale.setScalar(compactViewport ? .24 : 1);
        this.renderer.render(this.scene, this.camera);
      }
      if (imageCount && this.gallery) {
        this.renderer.clearDepth();
        this.renderer.render(this.gallery.scene, this.gallery.camera);
      }
      if (this.shaderFailed) { this.fail(); return; }
      this.hasRendered = true;
      this.canvas.style.visibility = 'visible';
      this.canvas.style.opacity = imageCount ? '1' : compactViewport ? '.24' : '1';
      document.documentElement.dataset.webgl = 'ready';
    } catch { this.fail(); }
  };

  private fail() {
    this.failed = true;
    this.dispose();
    document.documentElement.dataset.webgl = 'unavailable';
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribe();
    this.observer?.disconnect();
    this.removers.splice(0).reverse().forEach(remove => remove());
    this.reactor?.dispose();
    this.gallery?.dispose();
    this.scene.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.style.visibility = 'hidden';
    this.canvas.style.zIndex = '1';
    if (this.hasRendered) document.documentElement.dataset.webgl = 'unavailable';
  }
}
