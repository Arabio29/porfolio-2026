import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { MotionManager } from './motion-manager';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Readout shown in the section header. Pure for testing. */
export function formatReadout(link: string, mx: number, my: number, sv: number): string {
  const id = (link || '---').toUpperCase().slice(0, 8).padEnd(3, '-');
  const fx = (mx >= 0 ? '+' : '') + mx.toFixed(2);
  const fy = (my >= 0 ? '+' : '') + my.toFixed(2);
  const v = String(Math.round(Math.abs(sv))).padStart(4, '0');
  return `SYS.LIVE ▪ NODES 05 ▪ LINK ${id} ▪ MX ${fx} MY ${fy} ▪ SV ${v}`;
}

/** Particle budget scales with stage area. Pure for testing. */
export function pickParticleCount(area: number, isTouch: boolean): number {
  if (area <= 0) return 0;
  const base = Math.round(area / 16000);
  return clamp(base, isTouch ? 8 : 14, isTouch ? 26 : 64);
}

interface Particle { x: number; y: number; vx: number; vy: number; r: number; seed: number }
interface Anchor { id: string; x: number; y: number }
type QuickFn = ((v: number) => void) & { tween?: { kill: () => void } };

/**
 * Living network behind the ecosystem nodes.
 * Canvas2D (not a second WebGL renderer) draws the links, pulses and
 * ambient field; the DOM remains the authoritative, accessible content.
 */
export function initEcosystem(manager: MotionManager): () => void {
  const stage = document.querySelector<HTMLElement>('[data-ecosystem-stage]');
  if (!stage) return () => {};
  const canvas = stage.querySelector<HTMLCanvasElement>('[data-ecosystem-canvas]');
  const glow = stage.querySelector<HTMLElement>('[data-ecosystem-glow]');
  const core = stage.querySelector<HTMLElement>('[data-ecosystem-core]');
  const coreLabel = stage.querySelector<HTMLElement>('[data-ecosystem-core-label]');
  const coreSub = stage.querySelector<HTMLElement>('[data-ecosystem-core-sub]');
  const readout = document.querySelector<HTMLElement>('[data-eco-readout]');
  const nodes = Array.from(stage.querySelectorAll<HTMLDetailsElement>('[data-skill-node]'));
  const orbitTrack = document.querySelector<HTMLElement>('[data-orbit-track]');
  const ACCENT = '#ffff00';

  // Single-open accordion: native <details> still works with no JS.
  let activeId = '';
  let hoverId = '';
  const setCore = (id: string) => {
    if (!coreLabel || !coreSub) return;
    const node = nodes.find(n => n.dataset.skillNode === id);
    const name = node?.dataset.skillNode?.toUpperCase() ?? '';
    coreLabel.textContent = id ? String(nodes.indexOf(node!) + 1).padStart(2, '0') : 'e.';
    coreSub.textContent = id ? name : 'THE CORE';
    stage.dataset.link = id;
    if (!manager.state.reducedMotion && core) {
      gsap.fromTo(core, { scale: 0.94 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.55)', overwrite: 'auto' });
    }
  };
  const onToggle = (event: Event) => {
    const current = event.target as HTMLDetailsElement;
    if (current.open) {
      for (const node of nodes) if (node !== current && node.open) node.open = false;
      activeId = current.dataset.skillNode ?? '';
      setCore(activeId);
    } else if (current.dataset.skillNode === activeId) {
      activeId = '';
      setCore('');
    }
    queueMeasure();
  };
  const onEnter = (event: Event) => {
    const node = (event.target as Element | null)?.closest?.('[data-skill-node]') as HTMLElement | null;
    if (node?.dataset.skillNode) hoverId = node.dataset.skillNode;
  };
  const onLeave = () => { hoverId = ''; };
  const onFocus = (event: Event) => {
    const node = (event.target as Element | null)?.closest?.('[data-skill-node]') as HTMLElement | null;
    if (node?.dataset.skillNode) hoverId = node.dataset.skillNode;
  };
  nodes.forEach(node => node.addEventListener('toggle', onToggle));
  stage.addEventListener('pointerover', onEnter, { passive: true });
  stage.addEventListener('pointerleave', onLeave, { passive: true });
  stage.addEventListener('focusin', onFocus, { passive: true });
  stage.addEventListener('focusout', onLeave, { passive: true });

  // Reduced motion / no canvas: static content, accordion only.
  if (manager.state.reducedMotion || !canvas) {
    if (readout) readout.textContent = 'SYS.STATIC ▪ NODES 05 ▪ REDUCED MOTION';
    return () => {
      nodes.forEach(node => node.removeEventListener('toggle', onToggle));
      stage.removeEventListener('pointerover', onEnter);
      stage.removeEventListener('pointerleave', onLeave);
      stage.removeEventListener('focusin', onFocus);
      stage.removeEventListener('focusout', onLeave);
    };
  }

  gsap.registerPlugin(ScrollTrigger);
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  let width = 0, height = 0, dpr = 1;
  let anchors: Anchor[] = [];
  let corePos = { x: 0, y: 0, r: 60 };
  let particles: Particle[] = [];
  let visible = true;
  let measureQueued = false;
  let glowXTo: ((v: number) => void) | null = null;
  let glowYTo: ((v: number) => void) | null = null;
  const tilts = new Map<HTMLElement, { rx: (v: number) => void; ry: (v: number) => void }>();

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, manager.state.isTouch ? 1.5 : 2);
    width = rect.width; height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    particles = Array.from({ length: pickParticleCount(width * height, manager.state.isTouch) }, (_, i) => ({
      x: ((i * 197.3) % width + width) % width,
      y: ((i * 311.7) % height + height) % height,
      vx: ((i % 7) - 3) * 2.2,
      vy: ((i % 5) - 2) * 2.2,
      r: 0.8 + ((i * 13) % 10) / 9,
      seed: i * 0.7,
    }));
    measure();
  };

  const measure = () => {
    measureQueued = false;
    const box = stage.getBoundingClientRect();
    if (!box.width) return;
    anchors = nodes.map(node => {
      const r = node.getBoundingClientRect();
      return {
        id: node.dataset.skillNode ?? '',
        x: r.left - box.left + r.width / 2,
        y: r.top - box.top + Math.min(34, r.height / 2),
      };
    });
    if (core) {
      const r = core.getBoundingClientRect();
      corePos = { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2, r: r.width / 2 };
    }
  };
  const queueMeasure = () => {
    if (measureQueued) return;
    measureQueued = true;
    requestAnimationFrame(measure);
  };

  // Kinetic title: split once, reveal on scroll.
  const charBlocks = Array.from(document.querySelectorAll<HTMLElement>('[data-eco-chars]'));
  const splitStyles: string[] = charBlocks.map(el => el.style.cssText);
  charBlocks.forEach(el => {
    const text = el.textContent ?? '';
    el.setAttribute('aria-label', text);
    el.textContent = '';
    for (const word of text.split(' ')) {
      const wrapper = document.createElement('span');
      wrapper.className = 'eco-word';
      wrapper.setAttribute('aria-hidden', 'true');
      for (const ch of word) {
        const s = document.createElement('span');
        s.className = 'eco-char';
        s.textContent = ch;
        wrapper.appendChild(s);
      }
      el.appendChild(wrapper);
      el.appendChild(document.createTextNode(' '));
    }
  });

  const context = gsap.context(() => {
    // Percent-based centering survives breakpoint resizes; CSS keeps the no-JS fallback.
    if (core) gsap.set(core, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
    nodes.forEach(node => {
      if (node.classList.contains('tools')) gsap.set(node, { xPercent: -50, x: 0 });
    });
    charBlocks.forEach((el) => {
      gsap.fromTo(el.querySelectorAll('.eco-char'),
        { yPercent: 115, rotationX: -35 },
        {
          yPercent: 0, rotationX: 0, duration: 0.9, stagger: 0.022, ease: 'power4.out',
          transformPerspective: 700,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
    });
    if (core) {
      gsap.fromTo(core, { scale: 0.7, opacity: 0 }, {
        scale: 1, opacity: 1, duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: stage, start: 'top 80%', once: true },
      });
    }
    nodes.forEach((node, i) => {
      gsap.fromTo(node, { y: 36, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.7, delay: (i % 3) * 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: node, start: 'top 92%', once: true },
        clearProps: 'opacity',
      });
    });
    // Scroll-velocity skew on the title: fast scroll bends type, rest resolves.
    const title = document.querySelector<HTMLElement>('[data-ecosystem-title]');
    const skewTo = title
      ? gsap.quickTo(title, 'skewX', { duration: 0.4, ease: 'power2.out' }) as (v: number) => void
      : null;
    void skewTo;
  });
  // Scroll-velocity skew on the title: fast scroll bends type, rest resolves.
  const titleEl = document.querySelector<HTMLElement>('[data-ecosystem-title]');
  const skewTo = titleEl
    ? (gsap.quickTo(titleEl, 'skewX', { duration: 0.4, ease: 'power2.out' }) as unknown as ((v: number) => void) & { tween?: { kill: () => void } })
    : null;
  const offSkew = manager.onFrame(() => {
    if (!visible || document.hidden) return;
    skewTo?.(clamp(-manager.state.scroll.velocity / 900, -7, 7));
  });

  // Orbit marquee: constant drift, scroll velocity bends the tempo.
  let marquee: gsap.core.Tween | undefined;
  if (orbitTrack && !manager.state.isTouch) {
    marquee = gsap.to(orbitTrack, { xPercent: -50, duration: 26, repeat: -1, ease: 'none' });
  }

  // Pointer glow + node tilt.
  if (!manager.state.isTouch) {
    if (glow) {
      glowXTo = gsap.quickTo(glow, 'x', { duration: 0.6, ease: 'power3.out' }) as QuickFn;
      glowYTo = gsap.quickTo(glow, 'y', { duration: 0.6, ease: 'power3.out' }) as QuickFn;
    }
    nodes.forEach(node => {
      gsap.set(node, { transformPerspective: 800 });
      tilts.set(node, {
        rx: gsap.quickTo(node, 'rotationX', { duration: 0.5, ease: 'power3.out' }) as (v: number) => void,
        ry: gsap.quickTo(node, 'rotationY', { duration: 0.5, ease: 'power3.out' }) as (v: number) => void,
      });
    });
    const onMove = (event: PointerEvent) => {
      const box = stage.getBoundingClientRect();
      const px = event.clientX - box.left;
      const py = event.clientY - box.top;
      glowXTo?.(px - box.width / 2);
      glowYTo?.(py - box.height / 2);
      for (const node of nodes) {
        const motion = tilts.get(node);
        if (!motion) continue;
        const r = node.getBoundingClientRect();
        const cx = r.left - box.left + r.width / 2;
        const cy = r.top - box.top + r.height / 2;
        const dx = (px - cx) / Math.max(1, r.width);
        const dy = (py - cy) / Math.max(1, r.height);
        const near = Math.hypot(px - cx, py - cy) < 340;
        motion.ry(near ? clamp(dx * 7, -7, 7) : 0);
        motion.rx(near ? clamp(-dy * 7, -7, 7) : 0);
      }
    };
    stage.addEventListener('pointermove', onMove, { passive: true });
    stage.addEventListener('pointerleave', () => {
      nodes.forEach(node => { tilts.get(node)?.rx(0); tilts.get(node)?.ry(0); });
    }, { passive: true });
  }

  const observer = new IntersectionObserver(entries => {
    visible = entries.some(e => e.isIntersecting);
  }, { threshold: 0 });
  observer.observe(stage);
  const resizeObserver = new ResizeObserver(() => { resize(); });
  resizeObserver.observe(stage);
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('orientationchange', resize, { passive: true });
  if (document.fonts?.ready) void document.fonts.ready.then(() => queueMeasure()).catch(() => {});
  ScrollTrigger.addEventListener('refresh', measure);
  resize();

  let readoutTimer = 0;
  const offFrame = manager.onFrame((time, delta) => {
    if (!visible || document.hidden) return;
    const { mouse, scroll } = manager.state;
    const box = stage.getBoundingClientRect();
    const mx = (mouse.x + 1) / 2 * box.width;
    const my = (1 - mouse.y) / 2 * box.height;
    const energy = clamp(Math.abs(scroll.velocity) / 2200, 0, 1);
    const mEnergy = clamp(Math.hypot(mouse.velocityX, mouse.velocityY) / 6, 0, 1);

    // Marquee breathes with scroll speed.
    if (marquee) marquee.timeScale(1 + energy * 3 + mEnergy * 1.5);

    // Readout at ~10Hz; textContent only, no layout.
    readoutTimer += delta;
    if (readout && readoutTimer > 0.1) {
      readoutTimer = 0;
      readout.textContent = formatReadout(activeId || hoverId, mouse.x, mouse.y, scroll.velocity);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Ambient field.
    for (const p of particles) {
      p.x += (p.vx + mouse.velocityX * 6 * Math.exp(-Math.hypot(p.x - mx, p.y - my) / 220)) * delta;
      p.y += (p.vy - mouse.velocityY * 6 * Math.exp(-Math.hypot(p.x - mx, p.y - my) / 220)) * delta;
      if (p.x < -8) p.x = width + 8; if (p.x > width + 8) p.x = -8;
      if (p.y < -8) p.y = height + 8; if (p.y > height + 8) p.y = -8;
      const tw = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(time * 1.4 + p.seed));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,129,${tw.toFixed(3)})`;
      ctx.fill();
    }

    const linkId = activeId || hoverId;
    // Links core -> nodes.
    for (const a of anchors) {
      const isActive = a.id === linkId;
      const dx = a.x - corePos.x, dy = a.y - corePos.y;
      const len = Math.hypot(dx, dy) || 1;
      const sx = corePos.x + (dx / len) * (corePos.r * 0.9);
      const sy = corePos.y + (dy / len) * (corePos.r * 0.9);
      const mxp = (sx + a.x) / 2, myp = (sy + a.y) / 2 - len * 0.08;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(mxp, myp, a.x, a.y);
      ctx.setLineDash(isActive ? [] : [3, 9]);
      ctx.lineDashOffset = isActive ? -time * 60 : -time * 12;
      ctx.lineWidth = isActive ? 1.6 : 1;
      ctx.strokeStyle = isActive ? 'rgba(255,255,0,0.9)' : 'rgba(241,239,233,0.16)';
      ctx.shadowBlur = isActive ? 12 + energy * 18 : 0;
      ctx.shadowColor = ACCENT;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.setLineDash([]);
      // Data pulses travel toward the node.
      const pulses = isActive ? 3 : 1;
      for (let k = 0; k < pulses; k++) {
        const t = (time * (isActive ? 0.45 : 0.16) + a.x * 0.001 + k / pulses) % 1;
        const ix = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * mxp + t * t * a.x;
        const iy = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * myp + t * t * a.y;
        ctx.beginPath();
        ctx.arc(ix, iy, isActive ? 2.6 : 1.6, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? ACCENT : 'rgba(255,255,129,0.5)';
        ctx.fill();
      }
      // Node anchor dot.
      ctx.beginPath();
      ctx.arc(a.x, a.y, isActive ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#f1efe9' : 'rgba(241,239,233,0.4)';
      ctx.fill();
    }

    // Core aura reacts to scroll + pointer energy.
    const pulse = 1 + energy * 0.1 + mEnergy * 0.06 + Math.sin(time * 2.2) * 0.015;
    for (let i = 0; i < 2; i++) {
      const t = (time * 0.5 + i * 0.5) % 1;
      ctx.beginPath();
      ctx.arc(corePos.x, corePos.y, corePos.r * pulse * (0.7 + t * 0.9), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,0,${(0.35 * (1 - t)).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });

  let destroyed = false;
  return () => {
    if (destroyed) return; destroyed = true;
    offFrame();
    offSkew();
    skewTo?.tween?.kill();
    (glowXTo as unknown as QuickFn)?.tween?.kill();
    (glowYTo as unknown as QuickFn)?.tween?.kill();
    glowXTo = glowYTo = null;
    tilts.forEach(m => { (m.rx as unknown as { tween?: { kill: () => void } }).tween?.kill(); (m.ry as unknown as { tween?: { kill: () => void } }).tween?.kill(); });
    tilts.clear();
    observer.disconnect();
    resizeObserver.disconnect();
    window.removeEventListener('resize', resize);
    window.removeEventListener('orientationchange', resize);
    ScrollTrigger.removeEventListener('refresh', measure);
    nodes.forEach(node => node.removeEventListener('toggle', onToggle));
    stage.removeEventListener('pointerover', onEnter);
    stage.removeEventListener('pointerleave', onLeave);
    stage.removeEventListener('focusin', onFocus);
    stage.removeEventListener('focusout', onLeave);
    marquee?.kill();
    context.revert();
    charBlocks.forEach((el, i) => { el.style.cssText = splitStyles[i]; });
  };
}
