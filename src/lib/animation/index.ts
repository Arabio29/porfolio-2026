import { MotionManager } from './motion-manager';
import { initSections } from './sections';
import { initCursor } from './cursor';
import { initPhysics } from './physics';

export { MotionManager } from './motion-manager';
export type { MotionState, FrameCallback } from './motion-manager';
let current: (() => void) | undefined;

/** Call on astro:page-load. Cleanup is available without waiting for optional GPU work. */
export async function initMotion(): Promise<() => void> {
  current?.();
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};
  const manager = new MotionManager();
  let destroyed = false, generation = 0;
  let effects: (() => void)[] = [];
  let webgl: (() => void) | undefined;
  const clearEffects = () => {
    generation++;
    webgl?.(); webgl = undefined;
    effects.splice(0).reverse().forEach(cleanup => cleanup());
  };
  const configure = () => {
    if (destroyed) return;
    clearEffects();
    // Each scope owns its styles/listeners; native HTML remains the fallback.
    effects.push(initSections(manager), initCursor(manager), initPhysics(manager));
    if (manager.state.reducedMotion) return;
    const token = generation;
    void import('../webgl/experience').then(async ({ initWebGL }) => {
      if (destroyed || token !== generation) return;
      const cleanup = await initWebGL(manager);
      if (destroyed || token !== generation) cleanup();
      else webgl = cleanup;
    }).catch(error => {
      if (!destroyed && token === generation) console.warn('[motion] WebGL unavailable; retaining HTML.', error);
    });
  };
  const offPreferences = manager.onPreferencesChange(configure);
  const pagehide = (event: PageTransitionEvent) => { if (!event.persisted) cleanup(); };
  const cleanup = () => {
    if (destroyed) return; destroyed = true;
    document.removeEventListener('astro:before-swap', cleanup);
    window.removeEventListener('pagehide', pagehide);
    offPreferences(); clearEffects(); manager.destroy();
    if (current === cleanup) current = undefined;
  };
  current = cleanup;
  document.addEventListener('astro:before-swap', cleanup);
  window.addEventListener('pagehide', pagehide);
  try { configure(); } catch (error) {
    cleanup(); console.warn('[motion] Enhancement unavailable; retaining HTML.', error);
  }
  return cleanup;
}
