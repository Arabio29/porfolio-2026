import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { ringOf, ringTilt, ringYaw, clampTilt, ringPhase, tileFor, ringRadius, orbitRadius } from '../src/lib/animation/tech-orbit';

it('deals tiles round-robin across three rings', () => {
  expect(Array.from({ length: 9 }, (_, i) => ringOf(i))).toEqual([0, 1, 2, 0, 1, 2, 0, 1, 2]);
  expect(ringOf(29)).toBe(2);
});

it('keeps three distinct ring inclinations around the sphere', () => {
  expect(new Set([ringTilt(0), ringTilt(1), ringTilt(2)]).size).toBe(3);
  expect(ringYaw(0)).toBe(0);
  expect(ringYaw(1)).toBe(0);
});

it('clamps the user pitch to a readable band', () => {
  expect(clampTilt(10)).toBe(0.5);
  expect(clampTilt(-10)).toBe(-0.7);
  expect(clampTilt(0.1)).toBe(0.1);
});

it('staggers ring phases and fits tiles to the arc spacing', () => {
  expect(new Set([ringPhase(0), ringPhase(1), ringPhase(2)]).size).toBe(3);
  expect(tileFor(0, 10)).toBe(52);
  expect(tileFor(117, 10)).toBeLessThanOrEqual(60);
  expect(tileFor(60, 10)).toBe(52);
  expect(tileFor(500, 10)).toBe(132);
  expect(tileFor(190, 10)).toBeGreaterThan(90);
});

it('sizes the sphere to fill and bleed past the stage', () => {
  expect(orbitRadius(0, 800)).toBe(150);
  expect(orbitRadius(1270, 828)).toBeCloseTo(513, 0);
  expect(orbitRadius(3000, 2000)).toBe(520);
  expect(orbitRadius(346, 776)).toBeCloseTo(215, 0);
});

it('nests rings on concentric shells', () => {
  expect(ringRadius(200, 0)).toBe(200);
  expect(ringRadius(200, 1)).toBeCloseTo(144);
  expect(ringRadius(200, 2)).toBeCloseTo(100);
});

const gs = vi.hoisted(() => ({ revert: vi.fn() }));
vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    context: (fn: () => void) => { fn(); return { revert: gs.revert }; },
    fromTo: vi.fn(),
    to: vi.fn(),
    set: vi.fn(),
    killTweensOf: vi.fn(),
  },
}));
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: { getAll: () => [] },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('document', Object.assign(new EventTarget(), {
    hidden: false,
    querySelector: () => null,
    querySelectorAll: () => [],
  }));
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} unobserve() {} });
});
afterEach(() => vi.unstubAllGlobals());

it('stays a static grid without a stage, on touch or with reduced motion', async () => {
  const { initTechOrbit } = await import('../src/lib/animation/tech-orbit');
  const frame = vi.fn();
  const full = { state: { isTouch: false, reducedMotion: false }, onFrame: frame } as any;
  expect(() => initTechOrbit(full)()).not.toThrow();
  expect(frame).not.toHaveBeenCalled();
  initTechOrbit({ state: { isTouch: true, reducedMotion: false }, onFrame: frame } as any)();
  initTechOrbit({ state: { isTouch: false, reducedMotion: true }, onFrame: frame } as any)();
  expect(frame).not.toHaveBeenCalled();
});
