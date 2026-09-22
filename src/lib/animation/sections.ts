import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { MotionManager } from './motion-manager';

/** Scoped animations: reverting never touches another scene's ScrollTriggers. */
export function initSections(manager: MotionManager): () => void {
  gsap.registerPlugin(ScrollTrigger);
  const progress = document.querySelector<HTMLElement>('[data-progress]');
  const progressStyle = progress?.getAttribute('style');
  const updateProgress = () => {
    if (progress) {
      progress.style.transformOrigin = 'left center';
      progress.style.transform = `scaleX(${manager.state.scroll.progress})`;
    }
  };
  updateProgress();
  const offFrame = manager.onFrame(updateProgress);
  const extra: (() => void)[] = [];
  const context = gsap.context(() => {
    if (manager.state.reducedMotion) return;
    const hero = Array.from(document.querySelectorAll('[data-hero-line]'));
    if (hero.length) gsap.fromTo(hero,
      { yPercent: 110, rotationX: -12, opacity: 0, transformOrigin: '0% 100%' },
      { yPercent: 0, rotationX: 0, opacity: 1, duration: 1.05, stagger: 0.11, ease: 'power4.out', clearProps: 'transform,opacity,transformOrigin' });
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(element => {
      gsap.fromTo(element, { y: 32, clipPath: 'inset(0 0 100% 0)' }, {
        y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.85, ease: 'power3.out',
        scrollTrigger: { trigger: element, start: 'top 92%', once: true },
        clearProps: 'transform,clipPath',
      });
    });
    if (manager.state.isTouch) return;
    document.querySelectorAll<HTMLElement>('.depth-plane').forEach(element => {
      gsap.fromTo(element, { scaleX: 0.94, scaleY: 0.94, y: 54, rotationX: 4, transformPerspective: 1200 }, {
        scaleX: 1, scaleY: 1, y: 0, rotationX: 0, ease: 'none',
        scrollTrigger: { trigger: element, start: 'top 95%', end: 'top 35%', scrub: 0.6 },
      });
    });
    document.querySelectorAll<HTMLElement>('[data-project-link] .project-image img').forEach(image => {
      // WebGL owns project-image movement when an image belongs to a link.
      // Keep the DOM geometry stable so the GPU plane can stay in sync.
      if (image.closest('a')) return;
      gsap.fromTo(image, { yPercent: -3, scale: 1.07 }, {
        yPercent: 3, ease: 'none',
        scrollTrigger: { trigger: image, start: 'top bottom', end: 'bottom top', scrub: 0.7 },
      });
    });
    const lab = document.querySelector<HTMLElement>('#lab');
    const track = document.querySelector<HTMLElement>('#lab-track');
    if (lab && track && track.scrollWidth > lab.clientWidth) {
      // Native vertical scroll drives a short lateral reveal; no pin or wheel interception.
      const travel = () => Math.max(0, track.scrollWidth - lab.clientWidth);
      const tween = gsap.to(track, { x: () => -travel(), ease: 'none',
        scrollTrigger: { trigger: lab, start: 'top 75%', end: 'bottom 25%', scrub: 0.6, invalidateOnRefresh: true },
      });
      const keyboard = () => {
        tween.scrollTrigger?.kill(); tween.kill(); gsap.set(track, { clearProps: 'transform' });
      };
      track.addEventListener('focusin', keyboard);
      extra.push(() => track.removeEventListener('focusin', keyboard));
    }
  });
  let paused: gsap.core.Tween[] = [];
  const visibility = () => {
    if (document.hidden) {
      paused = context.getTweens().filter((tween: gsap.core.Tween) => !tween.paused() && tween.progress() < 1);
      paused.forEach(tween => tween.pause());
    } else { paused.forEach(tween => tween.resume()); paused = []; }
  };
  document.addEventListener('visibilitychange', visibility);
  visibility();
  let destroyed = false;
  return () => {
    if (destroyed) return; destroyed = true;
    document.removeEventListener('visibilitychange', visibility);
    offFrame(); extra.forEach(cleanup => cleanup()); context.revert();
    if (progress) {
      if (progressStyle == null) progress.removeAttribute('style');
      else progress.setAttribute('style', progressStyle);
    }
  };
}
