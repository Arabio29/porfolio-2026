import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Matter from 'matter-js';
vi.mock('gsap', () => ({ gsap: { registerPlugin: vi.fn() } }));
vi.mock('gsap/Flip', () => ({ Flip: { getState: vi.fn(() => ({})), from: vi.fn(() => ({ kill: vi.fn() })) } }));
import { initPhysics } from '../src/lib/animation/physics';
let intersect: (entries: any[]) => void, frames: Set<any>, manager: any, words: any[], zone: any;
const disconnect = vi.fn();
beforeEach(() => {
  vi.clearAllMocks(); frames = new Set();
  words = [0, 1].map(i => ({ style: { cssText: '', transform: '', willChange: '' }, getBoundingClientRect: () => ({ left: 20 + i * 100, top: 30, width: 80, height: 30 }) }));
  zone = { querySelectorAll: () => words, getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 }) };
  vi.stubGlobal('document', Object.assign(new EventTarget(), { hidden: false, querySelector: () => zone }));
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('IntersectionObserver', class { constructor(callback: any) { intersect = callback; } observe() {} disconnect = disconnect; });
  manager = { state: { isTouch: false, reducedMotion: false, mouse: { x: 0, y: 0, velocityX: 0, velocityY: 0 }, viewport: { width: 400, height: 300 }, scroll: { y: 0 } }, onFrame: (fn: any) => { frames.add(fn); return () => frames.delete(fn); } };
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it('runs one lazy Matter engine on the shared clock and restores flow on exit', async () => {
  const create = vi.spyOn(Matter.Engine, 'create');
  const cleanup = initPhysics(manager); expect(create).not.toHaveBeenCalled();
  intersect([{ isIntersecting: true, intersectionRatio: 0.8 }]);
  await vi.waitFor(() => expect(frames.size).toBe(1));
  intersect([{ isIntersecting: true, intersectionRatio: 0.8 }]);
  expect(create).toHaveBeenCalledOnce();
  for (const frame of frames) frame(1, 0.0167);
  expect(words[0].style.transform).toContain('translate3d');
  intersect([{ isIntersecting: false, intersectionRatio: 0 }]);
  expect(frames.size).toBe(0); expect(words[0].style.cssText).toBe('');
  cleanup(); cleanup(); expect(disconnect).toHaveBeenCalledOnce();
});
it('does not initialize physics for reduced motion or touch', () => {
  const create = vi.spyOn(Matter.Engine, 'create');
  manager.state.isTouch = true; initPhysics(manager)();
  manager.state.isTouch = false; manager.state.reducedMotion = true; initPhysics(manager)();
  expect(create).not.toHaveBeenCalled(); expect(frames.size).toBe(0);
});
it('cancels a pending lazy import when navigation destroys the scope', async () => {
  const cleanup = initPhysics(manager);
  intersect([{ isIntersecting: true, intersectionRatio: 1 }]); cleanup();
  await new Promise(resolve => setTimeout(resolve, 30));
  expect(frames.size).toBe(0);
});
