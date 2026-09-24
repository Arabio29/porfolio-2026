import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { MotionManager } from './motion-manager';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const RING_COUNT = 3;
const AUTO_SPEED = 0.28;

/** Round-robin ring assignment. Pure for testing. */
export function ringOf(index: number, ringCount: number = RING_COUNT): number {
  return ((index % ringCount) + ringCount) % ringCount;
}

/** Fixed great-circle inclination per ring: same tilt, three azimuths. Pure for testing. */
export function ringTilt(index: number): string {
  return ['rotateX(25deg)', 'rotateZ(120deg) rotateX(25deg)', 'rotateZ(240deg) rotateX(25deg)'][index % RING_COUNT];
}

/** Facing follows sphere rotation; ring tilt only perturbs it. Pure for testing. */
export function ringYaw(index: number): number {
  return [0, 0, 0][index % RING_COUNT];
}

/** User pitch stays within a readable band. Pure for testing. */
export function clampTilt(value: number): number {
  return clamp(value, -0.7, 0.5);
}

/** Phase offset per ring so crossings never align. Pure for testing. */
export function ringPhase(index: number): number {
  return [0, 0.21, 0.42][index % RING_COUNT];
}

/** Concentric shells keep crossings apart: outer, middle, inner. Pure for testing. */
export function ringRadius(radius: number, index: number): number {
  return radius * [1, 0.72, 0.5][index % RING_COUNT];
}

/** Tile width fits the arc spacing of the densest ring. Pure for testing. */
export function tileFor(radius: number, perRing: number): number {
  if (radius <= 0 || perRing <= 0) return 52;
  return clamp(((2 * Math.PI * radius) / perRing) * 0.78, 52, 132);
}

/** Sphere radius fills the stage and bleeds past its edges. Pure for testing. */
export function orbitRadius(stageWidth: number, stageHeight: number): number {
  if (stageWidth <= 0 || stageHeight <= 0) return 150;
  return clamp(Math.min(stageWidth, stageHeight) * 0.62, 150, 520);
}

/**
 * Armillary tech sphere. The semantic grid remains the markup (and the
 * touch / reduced-motion / no-JS rendering); on fine-pointer desktops the
 * tiles are lifted onto three inclined rings that auto-rotate, accept drag
 * with inertia and breathe with scroll velocity.
 */
export function initTechOrbit(manager: MotionManager): () => void {
  const wall = document.querySelector<HTMLElement>('[data-tech-orbit]');
  if (!wall || manager.state.isTouch || manager.state.reducedMotion) return () => {};
  const sphere = wall.querySelector<HTMLElement>('[data-tech-sphere]');
  const focusName = wall.querySelector<HTMLElement>('[data-tech-focus-name]');
  if (!sphere) return () => {};
  const tiles = Array.from(sphere.querySelectorAll<HTMLElement>('[data-tech-tile]'));
  if (!tiles.length) return () => {};

  gsap.registerPlugin(ScrollTrigger);
  // Scroll reveals own tile transforms; the sphere owns them from here on.
  gsap.killTweensOf(tiles);
  gsap.set(tiles, { clearProps: 'transform,opacity,clipPath' });
  for (const trigger of ScrollTrigger.getAll()) {
    if (trigger.trigger instanceof Element && tiles.includes(trigger.trigger as HTMLElement)) trigger.kill();
  }

  const homes = tiles.map(element => ({ element, parent: element.parentElement! }));
  const rings: HTMLElement[] = [];
  for (let index = 0; index < RING_COUNT; index += 1) {
    const ring = document.createElement('div');
    ring.className = 'orbit-ring';
    ring.style.transform = ringTilt(index);
    sphere.appendChild(ring);
    rings.push(ring);
  }
  const perRing = new Array<number>(RING_COUNT).fill(0);
  const placement = tiles.map((element, index) => {
    const ring = ringOf(index);
    const order = perRing[ring];
    perRing[ring] += 1;
    rings[ring].appendChild(element);
    return { element, ring, order };
  });
  for (const group of sphere.querySelectorAll<HTMLElement>('.tech-group')) group.style.display = 'none';
  const previousCursor = wall.getAttribute('data-cursor');
  wall.dataset.mode = 'orbit';
  wall.dataset.cursor = 'DRAG';
  const focusDefault = `${tiles.length} SIGNALS`;
  if (focusName) focusName.textContent = focusDefault;

  let radius = 300;
  const layout = () => {
    radius = orbitRadius(wall.clientWidth, wall.clientHeight || window.innerHeight * 0.8);
    for (let ring = 0; ring < RING_COUNT; ring += 1) {
      const width = Math.round(tileFor(ringRadius(radius, ring), perRing[ring] || 1));
      for (const tile of placement) {
        if (tile.ring === ring) tile.element.style.setProperty('--tile', `${width}px`);
      }
    }
  };
  layout();

  let rotY = 0.6;
  let rotX = -0.21;
  let inertiaY = 0;
  let dragging = false;
  let lastActive = -10;
  let lastPointer = { x: 0, y: 0 };
  let elapsed = 0;

  const onOver = (event: Event) => {
    const tile = (event.target as Element | null)?.closest?.('[data-tech-tile]') as HTMLElement | null;
    if (focusName) focusName.textContent = tile?.dataset.techTile?.toUpperCase() ?? focusDefault;
  };
  const onOut = () => { if (focusName) focusName.textContent = focusDefault; };
  const onDown = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || (event.button !== undefined && event.button !== 0)) return;
    dragging = true;
    lastPointer = { x: event.clientX, y: event.clientY };
    inertiaY = 0;
    try { wall.setPointerCapture(event.pointerId); } catch { /* pointer already released */ }
  };
  const onMove = (event: PointerEvent) => {
    if (!dragging) return;
    const dx = event.clientX - lastPointer.x;
    const dy = event.clientY - lastPointer.y;
    lastPointer = { x: event.clientX, y: event.clientY };
    rotY += dx * 0.006;
    rotX = clampTilt(rotX + dy * 0.0035);
    inertiaY = dx * 0.006 * 60;
    lastActive = elapsed;
  };
  const onUp = () => { dragging = false; lastActive = elapsed; };
  wall.addEventListener('pointerover', onOver, { passive: true });
  wall.addEventListener('pointerleave', onOut, { passive: true });
  wall.addEventListener('pointerdown', onDown);
  wall.addEventListener('pointermove', onMove, { passive: true });
  wall.addEventListener('pointerup', onUp, { passive: true });
  wall.addEventListener('pointercancel', onUp, { passive: true });
  window.addEventListener('resize', layout, { passive: true });

  const context = gsap.context(() => {
    gsap.fromTo(wall, { opacity: 0, y: 44 }, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: wall, start: 'top 85%', once: true },
      clearProps: 'opacity,transform',
    });
  });

  let visible = true;
  const observer = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
  }, { threshold: 0.1 });
  observer.observe(wall);

  const offFrame = manager.onFrame((_time, delta) => {
    if (!visible || document.hidden) return;
    elapsed += delta;
    const { mouse, scroll } = manager.state;
    const boost = clamp(Math.abs(scroll.velocity) / 2500, 0, 1.4);
    const mouseEnergy = clamp(Math.hypot(mouse.velocityX, mouse.velocityY) / 8, 0, 0.6);
    if (!dragging) {
      rotY += inertiaY * delta;
      inertiaY *= Math.exp(-3 * delta);
      if (elapsed - lastActive > 2.5) rotY += AUTO_SPEED * (1 + boost + mouseEnergy) * delta;
    }
    sphere.style.transform = `rotateX(${rotX.toFixed(4)}rad) rotateY(${rotY.toFixed(4)}rad)`;
    for (const tile of placement) {
      const siblings = perRing[tile.ring];
      const shell = ringRadius(radius, tile.ring);
      const angle = (tile.order / siblings) * Math.PI * 2 + ringPhase(tile.ring) + rotY + ringYaw(tile.ring);
      const depth = (Math.cos(angle) + 1) / 2;
      tile.element.style.opacity = (0.22 + 0.78 * depth).toFixed(3);
      tile.element.style.transform =
        `translate(-50%,-50%) rotateY(${(angle - rotY).toFixed(4)}rad) translateZ(${shell.toFixed(1)}px) scale(${(0.72 + 0.28 * depth).toFixed(3)})`;
    }
  });

  let destroyed = false;
  return () => {
    if (destroyed) return; destroyed = true;
    offFrame();
    observer.disconnect();
    window.removeEventListener('resize', layout);
    wall.removeEventListener('pointerover', onOver);
    wall.removeEventListener('pointerleave', onOut);
    wall.removeEventListener('pointerdown', onDown);
    wall.removeEventListener('pointermove', onMove);
    wall.removeEventListener('pointerup', onUp);
    wall.removeEventListener('pointercancel', onUp);
    context.revert();
    for (const ring of rings) ring.remove();
    // Append in original document order; stale sibling anchors may have moved ringside.
    for (const home of homes) home.parent.appendChild(home.element);
    for (const group of sphere.querySelectorAll<HTMLElement>('.tech-group')) group.style.display = '';
    for (const tile of tiles) { tile.style.transform = ''; tile.style.opacity = ''; }
    delete wall.dataset.mode;
    if (previousCursor == null) wall.removeAttribute('data-cursor');
    else wall.setAttribute('data-cursor', previousCursor);
    if (focusName) focusName.textContent = focusDefault;
  };
}
