import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const motion = vi.hoisted(() => ({ fromTo: vi.fn(), to: vi.fn(() => ({ scrollTrigger: { kill: vi.fn() }, kill: vi.fn() })), set: vi.fn(), getProperty: vi.fn(() => 0), revert: vi.fn(), refresh: vi.fn() }));
vi.mock('gsap', () => ({ gsap: { registerPlugin: vi.fn(),
  context: (fn: () => void) => { fn(); return { revert: motion.revert, getTweens: () => [] }; },
  fromTo: motion.fromTo, to: motion.to, set: motion.set, getProperty: motion.getProperty,
} }));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { refresh: motion.refresh } }));
import { initSections } from '../src/lib/animation/sections';

let documentMock: EventTarget & Record<string, any>;
const line = {}, reveal = {}, plane = {}, image = { closest: vi.fn(() => null as any) };
const work = { clientWidth: 800, querySelector: (s: string) => ({ '[data-work-window]': work, '[data-horizontal-track]': track }[s] ?? null) };
const track = { scrollWidth: 1600, dataset: {} as Record<string, string> };
it('leaves WebGL-owned image geometry untouched for cached DOM synchronization', () => {
  image.closest.mockReturnValue({});
  initSections(manager())();
  expect(motion.fromTo.mock.calls.some(([target]) => target === image)).toBe(false);
  image.closest.mockReturnValue(null);
});
beforeEach(() => {
  vi.clearAllMocks();
  documentMock = Object.assign(new EventTarget(), { hidden: false,
    querySelectorAll: (s: string) => ({ '[data-hero-line]': [line], '[data-reveal]': [reveal], '.depth-plane': [plane], '[data-project-link] .project-image img': [image] }[s] ?? []),
    querySelector: (s: string) => ({ '#work': work, '[data-work-window]': work, '[data-horizontal-track]': track }[s] ?? null),
  });
  vi.stubGlobal('document', documentMock);
});
afterEach(() => vi.unstubAllGlobals());
const manager = (reducedMotion = false, isTouch = false) => ({ state: { reducedMotion, isTouch, scroll: { progress: 0 } }, onFrame: () => () => {} }) as any;
it('keeps reduced-motion content completely static', () => {
  const cleanup = initSections(manager(true)); cleanup();
  expect(motion.fromTo).not.toHaveBeenCalled(); expect(motion.to).not.toHaveBeenCalled();
});
it('assembles hero, reveals text, adds desktop depth and restores its scoped context', () => {
  const cleanup = initSections(manager());
  expect(motion.fromTo.mock.calls.some(([target]) => Array.isArray(target) && target[0] === line)).toBe(true);
  expect(motion.fromTo.mock.calls.some(([target]) => target === reveal)).toBe(true);
  expect(motion.fromTo.mock.calls.some(([target]) => target === plane)).toBe(true);
  expect(motion.fromTo.mock.calls.some(([target]) => target === image)).toBe(true);
  cleanup(); cleanup(); expect(motion.revert).toHaveBeenCalledOnce();
});
it('leaves depth and image parallax off on touch devices', () => {
  initSections(manager(false, true))();
  expect(motion.fromTo.mock.calls.some(([target]) => target === plane || target === image)).toBe(false);
});
