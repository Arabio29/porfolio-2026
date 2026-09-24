import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { formatReadout, pickParticleCount } from '../src/lib/animation/ecosystem';
import { skills } from '../src/data/skills';

it('formats the live readout deterministically', () => {
  expect(formatReadout('backend', 0.5, -0.25, 1200)).toBe(
    'SYS.LIVE ▪ NODES 05 ▪ LINK BACKEND ▪ MX +0.50 MY -0.25 ▪ SV 1200',
  );
  expect(formatReadout('', 0, 0, 0)).toBe(
    'SYS.LIVE ▪ NODES 05 ▪ LINK --- ▪ MX +0.00 MY +0.00 ▪ SV 0000',
  );
});

it('scales the particle budget with area and device class', () => {
  expect(pickParticleCount(0, false)).toBe(0);
  expect(pickParticleCount(80000, true)).toBeLessThanOrEqual(pickParticleCount(80000, false));
  expect(pickParticleCount(10_000_000, false)).toBe(64);
  expect(pickParticleCount(10_000_000, true)).toBe(26);
});

it('keeps five honest skill layers with routable content', () => {
  expect(skills).toHaveLength(5);
  for (const skill of skills) {
    expect(skill.id).toMatch(/^[a-z]+$/);
    expect(skill.lead.length).toBeGreaterThan(0);
    expect(skill.detail.length).toBeGreaterThan(0);
    expect(skill.items.length).toBeGreaterThanOrEqual(4);
  }
  expect(new Set(skills.map(s => s.id)).size).toBe(skills.length);
});

const gs = vi.hoisted(() => ({ revert: vi.fn() }));
vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    context: (fn: () => void) => { fn(); return { revert: gs.revert }; },
    fromTo: vi.fn(),
    to: vi.fn(() => ({ kill: vi.fn(), timeScale: vi.fn() })),
    set: vi.fn(),
    quickTo: vi.fn(() => Object.assign(vi.fn(), { tween: { kill: vi.fn() } })),
  },
}));
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: { addEventListener: vi.fn(), removeEventListener: vi.fn() },
}));

let doc: any;
beforeEach(() => {
  vi.clearAllMocks();
  doc = Object.assign(new EventTarget(), {
    hidden: false,
    fonts: undefined,
    querySelector: (s: string) => (s === '[data-ecosystem-stage]' ? null : s.includes('eco-readout') ? { textContent: '' } : null),
    querySelectorAll: () => [],
  });
  vi.stubGlobal('document', doc);
  vi.stubGlobal('window', Object.assign(new EventTarget(), { devicePixelRatio: 1 }));
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} unobserve() {} });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} unobserve() {} });
});
afterEach(() => vi.unstubAllGlobals());

it('never throws when the stage is absent', async () => {
  const { initEcosystem } = await import('../src/lib/animation/ecosystem');
  const manager = { state: { reducedMotion: false, isTouch: false }, onFrame: () => () => {} } as any;
  expect(() => initEcosystem(manager)()).not.toThrow();
});
