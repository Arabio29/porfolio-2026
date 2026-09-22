import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const runtime = vi.hoisted(() => ({ ticks: new Set<(time: number, delta: number) => void>(), lenis: [] as any[] }));
vi.mock('gsap', () => ({ gsap: { ticker: {
  add: (fn: any) => runtime.ticks.add(fn), remove: (fn: any) => runtime.ticks.delete(fn),
} } }));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { update: vi.fn() } }));
vi.mock('lenis', () => ({ default: class {
  raf = vi.fn(); destroy = vi.fn(); stop = vi.fn(); start = vi.fn(); on = vi.fn();
  constructor(public options: any) { runtime.lenis.push(this); }
} }));
import { MotionManager } from '../src/lib/animation/motion-manager';

let manager: MotionManager;
let win: EventTarget & Record<string, any>;
let doc: EventTarget & Record<string, any>;
let media: Map<string, EventTarget & Record<string, any>>;
function tick(time = 1, delta = 16) { for (const fn of runtime.ticks) fn(time, delta); }
function change(query: string, matches: boolean) {
  const m = media.get(query)!; m.matches = matches; m.dispatchEvent(new Event('change'));
}
beforeEach(() => {
  runtime.ticks.clear(); runtime.lenis.length = 0; media = new Map();
  win = Object.assign(new EventTarget(), { innerWidth: 1000, innerHeight: 500, scrollY: 0,
    matchMedia: (q: string) => {
      if (!media.has(q)) media.set(q, Object.assign(new EventTarget(), { matches: false }));
      return media.get(q);
    },
  });
  doc = Object.assign(new EventTarget(), { hidden: false, documentElement: { scrollHeight: 1500 }, body: {} });
  vi.stubGlobal('window', win); vi.stubGlobal('document', doc);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => { manager?.destroy(); vi.unstubAllGlobals(); });

describe('MotionManager', () => {
  it('pauses hidden pages, resets resumed velocities, and tears down idempotently', () => {
    manager = new MotionManager(); const callback = vi.fn(); const off = manager.onFrame(callback);
    doc.hidden = true; doc.dispatchEvent(new Event('visibilitychange'));
    expect(runtime.ticks.size).toBe(0); expect(runtime.lenis[0].stop).toHaveBeenCalledOnce();
    tick(); expect(callback).not.toHaveBeenCalled();
    win.scrollY = 800; win.dispatchEvent(new Event('scroll'));
    doc.hidden = false; doc.dispatchEvent(new Event('visibilitychange')); tick();
    expect(manager.state.scroll.velocity).toBe(0);
    expect(runtime.lenis[0].start).toHaveBeenCalledOnce();
    off(); tick(); expect(callback).toHaveBeenCalledOnce();
    manager.destroy(); manager.destroy();
    expect(runtime.ticks.size).toBe(0); expect(runtime.lenis[0].destroy).toHaveBeenCalledOnce();
  });
  it('responds to live reduced-motion and coarse-pointer changes without duplicate Lenis', () => {
    manager = new MotionManager(); const notify = vi.fn(); manager.onPreferencesChange(notify);
    change('(prefers-reduced-motion: reduce)', true);
    expect(manager.state.reducedMotion).toBe(true);
    expect(runtime.lenis[0].destroy).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledOnce();
    change('(pointer: coarse)', true);
    change('(prefers-reduced-motion: reduce)', false);
    expect(manager.state.isTouch).toBe(true); expect(runtime.lenis).toHaveLength(1);
    change('(pointer: coarse)', false); expect(runtime.lenis).toHaveLength(2);
    manager.destroy(); change('(pointer: coarse)', true); expect(notify).toHaveBeenCalledTimes(4);
  });
  it('decays velocities at rest and never reads layout in the frame callback', () => {
    manager = new MotionManager();
    win.dispatchEvent(Object.assign(new Event('pointermove'), { clientX: 900, clientY: 200 }));
    tick(); const velocity = manager.state.mouse.velocityX;
    const layout = vi.fn(() => 1500);
    Object.defineProperty(doc.documentElement, 'scrollHeight', { get: layout });
    tick(2); expect(Math.abs(manager.state.mouse.velocityX)).toBeLessThan(velocity);
    expect(layout).not.toHaveBeenCalled();
  });
  it('shares normalized pointer, scroll progress and seconds through one ticker', () => {
    manager = new MotionManager();
    const callback = vi.fn(); manager.onFrame(callback);
    win.dispatchEvent(Object.assign(new Event('pointermove'), { clientX: 750, clientY: 125 }));
    win.scrollY = 500; win.dispatchEvent(new Event('scroll')); tick(2, 20);
    expect(manager.state.mouse.x).toBe(0.5);
    expect(manager.state.mouse.y).toBe(0.5);
    expect(manager.state.scroll.progress).toBe(0.5);
    expect(manager.state.scroll.direction).toBe(1);
    expect(callback).toHaveBeenCalledWith(2, 0.02);
    expect(runtime.ticks.size).toBe(1);
    expect(runtime.lenis[0].options.autoRaf).toBe(false);
    expect(runtime.lenis[0].raf).toHaveBeenCalledWith(2000);
  });
});
