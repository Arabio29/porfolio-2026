import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const gs = vi.hoisted(() => ({ quickTo: vi.fn(), calls: [] as any[], revert: vi.fn() }));
vi.mock('gsap', () => ({ gsap: { context: (fn: () => void) => { fn(); return { revert: gs.revert }; },
  quickTo: (target: any, prop: string) => { const fn = Object.assign(vi.fn(), { tween: { kill: vi.fn() } }); gs.calls.push({ target, prop, fn }); return fn; },
  set: (target: any, vars: any) => Object.assign(target.style, vars),
} }));
import { initCursor } from '../src/lib/animation/cursor';
let doc: any, cursor: any, frame: any, mgr: any;
beforeEach(() => {
  gs.calls.length = 0; vi.clearAllMocks();
  const label = { textContent: '' };
  cursor = { style: {}, getAttribute: () => null, removeAttribute: vi.fn(), querySelector: () => label };
  doc = Object.assign(new EventTarget(), { hidden: false, querySelector: () => cursor });
  mgr = { state: { reducedMotion: false, isTouch: false, viewport: { width: 1000, height: 500 }, mouse: { x: 0.5, y: 0.5 }, scroll: { y: 0 } }, onFrame: (fn: any) => { frame = fn; return vi.fn(); } };
  vi.stubGlobal('document', doc); vi.stubGlobal('window', new EventTarget());
});
afterEach(() => vi.unstubAllGlobals());
it('uses quickTo with shared normalized coordinates and contextual labels', () => {
  const cleanup = initCursor(mgr);
  const link = { dataset: { cursor: 'VIEW PROJECT' }, closest: (s: string) => s.includes('data-cursor') ? link : null };
  const event = new Event('pointerover'); Object.defineProperty(event, 'target', { value: link }); doc.dispatchEvent(event);
  frame();
  expect(gs.calls.find(x => x.target === cursor && x.prop === 'x').fn).toHaveBeenCalledWith(750);
  expect(gs.calls.find(x => x.target === cursor && x.prop === 'y').fn).toHaveBeenCalledWith(125);
  expect(cursor.querySelector().textContent).toBe('VIEW PROJECT');
  cleanup(); cleanup(); expect(gs.revert).toHaveBeenCalledOnce();
  expect(gs.calls.every(x => x.fn.tween.kill.mock.calls.length === 1)).toBe(true);
});
it('never creates pointer animation for touch or reduced motion', () => {
  mgr.state.isTouch = true; initCursor(mgr)();
  mgr.state.isTouch = false; mgr.state.reducedMotion = true; initCursor(mgr)();
  expect(gs.calls).toHaveLength(0);
});
