import { describe, expect, it } from 'vitest';
import { damp, sceneProgress, imageRect, renderBudget } from '../src/lib/webgl/core';

describe('WebGL core', () => {
  it('projects cached document bounds without new layout reads and clamps render cost', () => {
    expect(imageRect({ left: 100, top: 1400, width: 400, height: 250 }, 1200, 1000, 800)).toEqual({ x: -200, y: 75, width: 400, height: 250, visible: true });
    expect(imageRect({ left: 0, top: 4000, width: 400, height: 250 }, 0, 1000, 800).visible).toBe(false);
    expect(renderBudget(true, 3)).toEqual({ dpr: 1.35, particles: 900, segments: 48 });
    expect(renderBudget(false, 3)).toEqual({ dpr: 1.75, particles: 2400, segments: 96 });
    expect(renderBudget(false, 0).dpr).toBe(1);
  });
  it('dissolves from hero into manifesto and regroups at contact', () => {
    const sections = { heroTop: 0, heroHeight: 1000, manifestoTop: 1000, contactTop: 8000 };
    expect(sceneProgress(0, 1000, sections)).toEqual({ dissolve: 0, regroup: 0 });
    expect(sceneProgress(1000, 1000, sections).dissolve).toBe(1);
    expect(sceneProgress(5000, 1000, sections).regroup).toBe(0);
    expect(sceneProgress(8000, 1000, sections).regroup).toBe(1);
    expect(sceneProgress(0, 0, { heroTop: 0, heroHeight: 0, manifestoTop: 0, contactTop: Infinity }).dissolve).toBe(0);
  });
  it('uses frame-rate independent inertia without overshooting', () => {
    const oneFrame = damp(0, 1, 5, 1 / 30);
    const twoFrames = damp(damp(0, 1, 5, 1 / 60), 1, 5, 1 / 60);
    expect(oneFrame).toBeCloseTo(twoFrames, 10);
    expect(damp(0, 1, 5, -1)).toBe(0);
    expect(damp(0, 1, 5, 10)).toBeLessThanOrEqual(1);
  });
});
