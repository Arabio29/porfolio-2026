import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ managers: [] as any[], sectionClean: vi.fn(), cursorClean: vi.fn(), physicsClean: vi.fn(), webglClean: vi.fn(), webglInit: vi.fn(), prefs: undefined as undefined | (() => void) }));
vi.mock('../src/lib/animation/motion-manager', () => ({ MotionManager: class {
  state = { reducedMotion: false, isTouch: false }; destroy = vi.fn();
  constructor() { state.managers.push(this); }
  onPreferencesChange(fn: () => void) { state.prefs = fn; return vi.fn(); }
} }));
vi.mock('../src/lib/animation/sections', () => ({ initSections: () => state.sectionClean }));
vi.mock('../src/lib/animation/cursor', () => ({ initCursor: vi.fn(() => state.cursorClean) }));
import { initCursor } from '../src/lib/animation/cursor';
it('cleans earlier enhancements if a later enhancement fails to initialize', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.mocked(initCursor).mockImplementationOnce(() => { throw new Error('fixture failure'); });
  cleanup = await initMotion();
  expect(state.sectionClean).toHaveBeenCalledOnce();
  expect(state.managers[0].destroy).toHaveBeenCalledOnce();
  warning.mockRestore();
});
vi.mock('../src/lib/animation/physics', () => ({ initPhysics: () => state.physicsClean }));
vi.mock('../src/lib/webgl/experience', () => ({ initWebGL: state.webglInit }));
import { initMotion } from '../src/lib/animation';
let cleanup: () => void;
beforeEach(() => {
  vi.clearAllMocks(); state.managers.length = 0;
  state.webglInit.mockResolvedValue(state.webglClean);
  vi.stubGlobal('document', new EventTarget()); vi.stubGlobal('window', new EventTarget());
});
afterEach(() => { cleanup?.(); vi.unstubAllGlobals(); });
it('reinitializes preferences and disposes all owned effects before Astro swaps', async () => {
  cleanup = await initMotion();
  await vi.waitFor(() => expect(state.webglInit).toHaveBeenCalledOnce());
  state.managers[0].state.reducedMotion = true; state.prefs!();
  expect(state.sectionClean).toHaveBeenCalledOnce(); expect(state.webglClean).toHaveBeenCalledOnce();
  document.dispatchEvent(new Event('astro:before-swap'));
  expect(state.managers[0].destroy).toHaveBeenCalledOnce();
  expect(state.sectionClean).toHaveBeenCalledTimes(2);
  expect(state.cursorClean).toHaveBeenCalledTimes(2); expect(state.physicsClean).toHaveBeenCalledTimes(2);
  cleanup(); expect(state.managers[0].destroy).toHaveBeenCalledOnce();
});
it('never leaves two managers alive after repeated initialization', async () => {
  await initMotion(); cleanup = await initMotion();
  expect(state.managers[0].destroy).toHaveBeenCalledOnce();
  expect(state.managers[1].destroy).not.toHaveBeenCalled();
});
it('immediately disposes an async WebGL initialization that finishes after navigation', async () => {
  let resolve!: (cleanup: () => void) => void;
  state.webglInit.mockReturnValue(new Promise(done => { resolve = done; }));
  cleanup = await initMotion();
  await vi.waitFor(() => expect(state.webglInit).toHaveBeenCalledOnce());
  cleanup(); resolve(state.webglClean);
  await vi.waitFor(() => expect(state.webglClean).toHaveBeenCalledOnce());
});
