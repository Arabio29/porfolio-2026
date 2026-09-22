import { gsap } from 'gsap';
import type { MotionManager } from './motion-manager';
type Quick = ReturnType<typeof gsap.quickTo>;

/** Enhances, never removes the native pointer; delegated labels work with nested SVG/text. */
export function initCursor(manager: MotionManager): () => void {
  const cursor = document.querySelector<HTMLElement>('#cursor');
  if (!cursor || manager.state.isTouch || manager.state.reducedMotion) return () => {};
  const label = cursor.querySelector('span');
  const previousLabel = label?.textContent ?? '';
  const quick: Quick[] = [];
  const magnetic = new Map<HTMLElement, { x: Quick; y: Quick; style: string | null }>();
  let active: HTMLElement | null = null;
  let bounds = { x: 0, y: 0, width: 0, height: 0 };
  let visible = false;
  let xTo: Quick, yTo: Quick, scaleTo: Quick;
  const context = gsap.context(() => {
    gsap.set(cursor, { xPercent: -50, yPercent: -50, opacity: 0, pointerEvents: 'none' });
    xTo = gsap.quickTo(cursor, 'x', { duration: 0.24, ease: 'power3.out' });
    yTo = gsap.quickTo(cursor, 'y', { duration: 0.24, ease: 'power3.out' });
    scaleTo = gsap.quickTo(cursor, 'scale', { duration: 0.2, ease: 'power2.out' });
    quick.push(xTo, yTo, scaleTo);
  });
  const measure = () => {
    if (!active) return;
    const rect = active.getBoundingClientRect();
    bounds = { x: rect.left, y: rect.top + manager.state.scroll.y, width: rect.width, height: rect.height };
  };
  const release = () => {
    if (active) { const motion = magnetic.get(active)!; motion.x(0); motion.y(0); active = null; }
  };
  const over = (event: Event) => {
    const target = event.target as Element | null;
    if (!target?.closest) return;
    visible = true; gsap.set(cursor, { opacity: 1 });
    const link = target.closest<HTMLElement>('[data-cursor], a, button, summary');
    if (label) label.textContent = link?.dataset.cursor ?? '';
    scaleTo(link ? 1.45 : 1);
    const next = target.closest<HTMLElement>('[data-magnetic]');
    if (next === active) return;
    release(); active = next;
    if (active) {
      if (!magnetic.has(active)) {
        const x = gsap.quickTo(active, 'x', { duration: 0.45, ease: 'power3.out' });
        const y = gsap.quickTo(active, 'y', { duration: 0.45, ease: 'power3.out' });
        magnetic.set(active, { x, y, style: active.getAttribute('style') }); quick.push(x, y);
      }
      measure();
    }
  };
  const hide = () => { visible = false; gsap.set(cursor, { opacity: 0 }); release(); };
  const out = (event: Event) => { if (!(event as PointerEvent).relatedTarget) hide(); };
  const visibility = () => { if (document.hidden) hide(); };
  let previousX = NaN, previousY = NaN, previousScroll = NaN;
  const off = manager.onFrame(() => {
    if (!visible) return;
    const { mouse, viewport, scroll } = manager.state;
    const x = (mouse.x + 1) * viewport.width / 2;
    const y = (1 - mouse.y) * viewport.height / 2;
    if (x === previousX && y === previousY && scroll.y === previousScroll) return;
    xTo(x); yTo(y); previousX = x; previousY = y; previousScroll = scroll.y;
    if (active) {
      const motion = magnetic.get(active)!;
      motion.x(Math.max(-12, Math.min(12, (x - bounds.x - bounds.width / 2) * 0.15)));
      motion.y(Math.max(-10, Math.min(10, (y + scroll.y - bounds.y - bounds.height / 2) * 0.15)));
    }
  });
  document.addEventListener('pointerover', over, { passive: true });
  document.addEventListener('pointerout', out, { passive: true });
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('blur', hide);
  window.addEventListener('resize', measure, { passive: true });
  let destroyed = false;
  return () => {
    if (destroyed) return; destroyed = true;
    off(); document.removeEventListener('pointerover', over); document.removeEventListener('pointerout', out);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('blur', hide); window.removeEventListener('resize', measure);
    quick.forEach(fn => fn.tween.kill()); context.revert();
    magnetic.forEach(({ style }, element) => {
      if (style == null) element.removeAttribute('style'); else element.setAttribute('style', style);
    });
    if (label) label.textContent = previousLabel;
  };
}
