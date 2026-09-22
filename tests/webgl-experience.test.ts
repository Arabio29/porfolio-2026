import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MotionManager } from '../src/lib/animation/motion-manager';
import { initWebGL } from '../src/lib/webgl/experience';

const rendererState = vi.hoisted(() => ({ renders: 0, disposals: 0 }));
vi.mock('three', async (original) => {
  const actual = await original<typeof import('three')>();
  return { ...actual, WebGLRenderer: class {
    debug = { onShaderError: null };
    setPixelRatio() {} setSize() {} setClearColor() {} clear() {} clearDepth() {}
    render() { rendererState.renders++; }
    dispose() { rendererState.disposals++; }
    forceContextLoss() {}
  } };
});
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { addEventListener: vi.fn(), removeEventListener: vi.fn() } }));

afterEach(() => vi.unstubAllGlobals());

describe('WebGL initialization boundary', () => {
  it('uses the shared frame clock, pauses hidden pages, and tears down on context loss', async () => {
    const canvas = Object.assign(new EventTarget(), { style: {}, setAttribute: vi.fn() });
    const hero = { getBoundingClientRect: vi.fn(() => ({ top: 0, height: 800, bottom: 800 })) };
    const document = Object.assign(new EventTarget(), {
      documentElement: { dataset: {} as Record<string, string> }, hidden: false,
      querySelector: (s: string) => s === '#webgl-canvas' ? canvas : s === '#hero' ? hero : null,
      querySelectorAll: () => [],
    });
    vi.stubGlobal('document', document);
    vi.stubGlobal('window', Object.assign(new EventTarget(), { devicePixelRatio: 2, innerWidth: 1200, innerHeight: 800 }));
    const unsubscribe = vi.fn();
    let frame: (time: number, delta: number) => void = () => {};
    const state = { reducedMotion: false, isTouch: false, viewport: { width: 1200, height: 800 },
      scroll: { y: 0, velocity: 0, progress: 0, direction: 0 }, mouse: { x: 0, y: 0, velocityX: 0, velocityY: 0 } };
    const cleanup = await initWebGL({ state, onFrame: (cb: typeof frame) => { frame = cb; return unsubscribe; } } as unknown as MotionManager);
    frame(1, 1 / 60);
    expect(document.documentElement.dataset.webgl).toBe('ready');
    const count = rendererState.renders;
    document.hidden = true;
    frame(2, 1 / 60);
    expect(rendererState.renders).toBe(count);
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    expect(document.documentElement.dataset.webgl).toBe('unavailable');
    cleanup(); cleanup();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(rendererState.disposals).toBe(1);
  });
  it('is server-safe and returns idempotent cleanup without touching a renderer', async () => {
    const cleanup = await initWebGL({} as MotionManager);
    expect(cleanup).toBeTypeOf('function');
    expect(() => { cleanup(); cleanup(); }).not.toThrow();
  });
  it('does not request a graphics context or subscribe when reduced motion is set', async () => {
    const canvas = { style: { visibility: '' } };
    const document = { documentElement: { dataset: {} as Record<string, string> }, querySelector: vi.fn(() => canvas) };
    vi.stubGlobal('document', document);
    const onFrame = vi.fn();
    const cleanup = await initWebGL({ state: { reducedMotion: true }, onFrame } as unknown as MotionManager);
    expect(document.documentElement.dataset.webgl).toBe('unavailable');
    expect(canvas.style.visibility).toBe('hidden');
    expect(onFrame).not.toHaveBeenCalled();
    cleanup();
  });
});
