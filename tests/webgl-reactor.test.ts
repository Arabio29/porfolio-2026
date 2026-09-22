import { describe, expect, it, vi } from 'vitest';
import { particleData } from '../src/lib/webgl/particles';

import { createReactor } from '../src/lib/webgl/reactor';
import { Mesh, Points, InstancedMesh } from 'three';

describe('procedural reactor', () => {
  it('builds engineered instanced rings, morphs uniforms, and disposes shared resources once', () => {
    const reactor = createReactor(128, 48, 1);
    let ringCount = 0;
    const geometries = new Set<any>();
    const materials = new Set<any>();
    reactor.group.traverse((object) => {
      if (object instanceof InstancedMesh) ringCount += object.count;
      if (object instanceof Mesh || object instanceof Points) {
        geometries.add(object.geometry);
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
      }
    });
    expect(ringCount).toBeGreaterThanOrEqual(48);
    expect(reactor.points.geometry.getAttribute('position').count).toBe(128);
    reactor.update(2, 1 / 60, .7, .9, { x: .2, y: -.1, velocityX: 100, velocityY: 50 });
    expect(reactor.points.material.uniforms.uDissolve.value).toBe(.7);
    expect(reactor.points.material.uniforms.uRegroup.value).toBe(.9);
    const spies = [...geometries, ...materials].map(resource => vi.spyOn(resource, 'dispose'));
    reactor.dispose();
    reactor.dispose();
    spies.forEach(spy => expect(spy).toHaveBeenCalledTimes(1));
  });
  it('generates reproducible toroidal particles and a distinct contact symbol', () => {
    const data = particleData(128);
    expect(data.position).toHaveLength(384);
    expect(data.position).toEqual(particleData(128).position);
    expect(data.scatter).not.toEqual(data.position);
    expect(data.symbol).not.toEqual(data.position);
    expect([...data.position, ...data.scatter, ...data.symbol].every(Number.isFinite)).toBe(true);
    for (let i = 0; i < data.position.length; i += 3) {
      const radius = Math.hypot(data.position[i], data.position[i + 1]);
      expect(radius).toBeGreaterThan(0.9);
      expect(radius).toBeLessThan(2.7);
    }
    expect(particleData(0).position).toHaveLength(0);
  });
});
