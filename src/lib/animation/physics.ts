import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import type { MotionManager } from './motion-manager';

/** One bounded, lazy physics moment. No Runner, canvas, MouseConstraint or wheel handlers. */
export function initPhysics(manager: MotionManager): () => void {
  const zone = document.querySelector<HTMLElement>('#physics-zone');
  if (!zone || manager.state.isTouch || manager.state.reducedMotion || typeof IntersectionObserver === 'undefined') return () => {};
  const words = Array.from(zone.querySelectorAll<HTMLElement>('[data-physics-word]'));
  if (!words.length) return () => {};
  gsap.registerPlugin(Flip);
  const styles = words.map(word => word.style.cssText);
  let destroyed = false, visible = false, generation = 0;
  let stopEngine: (() => void) | undefined;
  let restoreTween: gsap.core.Timeline | undefined;
  const restore = () => { words.forEach((word, i) => { word.style.cssText = styles[i]; }); };
  const stop = (animate = false) => {
    generation++;
    restoreTween?.kill(); restoreTween = undefined;
    const state = animate && stopEngine ? Flip.getState(words) : undefined;
    stopEngine?.(); stopEngine = undefined; restore();
    if (state) restoreTween = Flip.from(state, { duration: 0.5, ease: 'power3.out', absolute: false, onComplete: restore });
  };
  const start = async () => {
    if (destroyed || !visible || document.hidden || stopEngine) return;
    const token = ++generation;
    try {
      const { default: Matter } = await import('matter-js');
      if (destroyed || token !== generation || !visible || document.hidden) return;
      restoreTween?.kill(); restoreTween = undefined; restore();
      const rect = zone.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const origin = { x: rect.left, y: rect.top + manager.state.scroll.y };
      const initial = words.map(word => {
        const box = word.getBoundingClientRect();
        return { x: box.left - rect.left + box.width / 2, y: box.top - rect.top + box.height / 2, width: Math.max(1, box.width), height: Math.max(1, box.height) };
      });
      const engine = Matter.Engine.create({ enableSleeping: true, gravity: { x: 0, y: 0.7 } });
      const bodies = initial.map(box => Matter.Bodies.rectangle(box.x, box.y, box.width, box.height, { restitution: 0.45, friction: 0.25, frictionAir: 0.025 }));
      const walls = [
        Matter.Bodies.rectangle(rect.width / 2, rect.height + 25, rect.width + 100, 50, { isStatic: true }),
        Matter.Bodies.rectangle(-25, rect.height / 2, 50, rect.height * 2, { isStatic: true }),
        Matter.Bodies.rectangle(rect.width + 25, rect.height / 2, 50, rect.height * 2, { isStatic: true }),
      ];
      Matter.Composite.add(engine.world, [...bodies, ...walls]);
      words.forEach(word => { word.style.willChange = 'transform'; });
      let accumulator = 0;
      const off = manager.onFrame((_time, delta) => {
        const { mouse, viewport, scroll } = manager.state;
        const px = (mouse.x + 1) * viewport.width / 2 - origin.x;
        const py = (1 - mouse.y) * viewport.height / 2 + scroll.y - origin.y;
        bodies.forEach(body => {
          if (Math.hypot(body.position.x - px, body.position.y - py) < 100 && Math.hypot(mouse.velocityX, mouse.velocityY) > 0.1) {
            Matter.Sleeping.set(body, false);
            Matter.Body.applyForce(body, body.position, {
              x: Math.max(-0.003, Math.min(0.003, mouse.velocityX * 0.00012)),
              y: Math.max(-0.003, Math.min(0.003, -mouse.velocityY * 0.00012)),
            });
          }
        });
        accumulator += Math.min(delta, 0.05);
        while (accumulator >= 1 / 60) { Matter.Engine.update(engine, 1000 / 60); accumulator -= 1 / 60; }
        bodies.forEach((body, i) => {
          words[i].style.transform = `translate3d(${body.position.x - initial[i].x}px,${body.position.y - initial[i].y}px,0) rotate(${body.angle}rad)`;
        });
      });
      stopEngine = () => { off(); Matter.Composite.clear(engine.world, false); Matter.Engine.clear(engine); };
    } catch (error) {
      // Text remains authoritative if this optional chunk cannot load.
      stop(); console.warn('[motion] Physics unavailable; retaining static words.', error);
    }
  };
  const observer = new IntersectionObserver(entries => {
    const entry = entries[0];
    const next = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.18);
    if (next === visible) return;
    visible = next;
    if (visible) void start(); else stop(!document.hidden);
  }, { threshold: [0, 0.18] });
  observer.observe(zone);
  const resize = () => { stop(); if (visible) void start(); };
  const visibility = () => { if (document.hidden) stop(); else if (visible) void start(); };
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', visibility);
  return () => {
    if (destroyed) return; destroyed = true; observer.disconnect(); stop();
    window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', visibility);
  };
}
