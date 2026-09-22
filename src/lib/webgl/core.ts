export const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));
const smooth = (value: number): number => { const t = clamp(value); return t * t * (3 - 2 * t); };

export interface SectionBounds { heroTop: number; heroHeight: number; manifestoTop: number; contactTop: number }
export function sceneProgress(scrollY: number, height: number, sections: SectionBounds) {
  const start = sections.heroTop + sections.heroHeight * 0.12;
  const end = Math.max(start + 1, sections.manifestoTop);
  const dissolve = smooth((scrollY - start) / (end - start));
  const regroup = Number.isFinite(sections.contactTop)
    ? smooth((scrollY + height * 0.85 - sections.contactTop) / Math.max(1, height * 0.85)) : 0;
  return { dissolve, regroup };
}

export interface CachedRect { left: number; top: number; width: number; height: number }
export function imageRect(rect: CachedRect, scrollY: number, width: number, height: number) {
  const top = rect.top - scrollY;
  return { x: rect.left + rect.width / 2 - width / 2, y: height / 2 - top - rect.height / 2,
    width: rect.width, height: rect.height,
    visible: rect.width > 0 && rect.height > 0 && top < height && top + rect.height > 0 && rect.left < width && rect.left + rect.width > 0 };
}
export function renderBudget(touch: boolean, deviceDpr: number) {
  return { dpr: clamp(deviceDpr || 1, 1, touch ? 1.35 : 1.75), particles: touch ? 900 : 2400, segments: touch ? 48 : 96 };
}

/** Refresh-rate independent exponential damping; negative deltas are inert. */
export function damp(current: number, target: number, rate: number, delta: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * Math.max(0, delta)));
}
