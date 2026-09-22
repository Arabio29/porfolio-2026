import {
  AdditiveBlending, BoxGeometry, BufferAttribute, BufferGeometry, Color, Group,
  InstancedMesh, Material, Mesh, Object3D, Points, ShaderMaterial, TorusGeometry,
} from 'three';
import { clamp, damp } from './core';
import { particleData } from './particles';
import { metalVertex, metalFragment, particleVertex, particleFragment } from './shaders/reactor';

type Mouse = { x: number; y: number; velocityX: number; velocityY: number };

export function createReactor(count: number, segments: number, dpr: number) {
  const group = new Group();
  const machine = new Group();
  group.add(machine);
  const dissolve = { value: 0 };
  const material = (chrome: number) => new ShaderMaterial({
    vertexShader: metalVertex, fragmentShader: metalFragment,
    uniforms: { uColor: { value: new Color('#2957ff') }, uChrome: { value: chrome }, uDissolve: dissolve },
  });
  const cobalt = material(0);
  const chrome = material(1);
  const dummy = new Object3D();
  const bands: Group[] = [];
  for (let ring = 0; ring < 3; ring++) {
    const band = new Group();
    band.position.z = (ring - 1) * .27;
    band.rotation.x = (ring - 1) * .17;
    const arc = new TorusGeometry(1.22 + ring * .48, ring === 1 ? .16 : .115, 10, Math.max(6, segments / 12), Math.PI * 2 / 12 * .88);
    const blueParts = new InstancedMesh(arc, cobalt, 8);
    const silverParts = new InstancedMesh(arc, chrome, 4);
    let blue = 0, silver = 0;
    for (let i = 0; i < 12; i++) {
      dummy.position.set(0, 0, 0);
      dummy.rotation.set(0, 0, i * Math.PI * 2 / 12);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      if (i % 3 === 0) silverParts.setMatrixAt(silver++, dummy.matrix);
      else blueParts.setMatrixAt(blue++, dummy.matrix);
    }
    band.add(blueParts, silverParts);
    machine.add(band);
    bands.push(band);
  }
  const struts = new InstancedMesh(new BoxGeometry(.9, .055, .11), chrome, 24);
  for (let i = 0; i < 24; i++) {
    const angle = (i % 12) / 12 * Math.PI * 2;
    dummy.position.set(Math.cos(angle) * 1.73, Math.sin(angle) * 1.73, i < 12 ? -.32 : .32);
    dummy.rotation.set(0, i < 12 ? -.25 : .25, angle);
    dummy.updateMatrix();
    struts.setMatrixAt(i, dummy.matrix);
  }
  machine.add(struts);
  const trackGeometry = new TorusGeometry(2.4, .014, 5, segments);
  const track = new Mesh(trackGeometry, chrome);
  track.rotation.x = .16;
  machine.add(track);
  const core = new Mesh(new TorusGeometry(.76, .045, 8, segments), cobalt);
  core.rotation.x = Math.PI / 2.8;
  machine.add(core);

  const data = particleData(count);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(data.position, 3));
  geometry.setAttribute('aScatter', new BufferAttribute(data.scatter, 3));
  geometry.setAttribute('aSymbol', new BufferAttribute(data.symbol, 3));
  geometry.setAttribute('aSeed', new BufferAttribute(data.seed, 1));
  const pointMaterial = new ShaderMaterial({
    vertexShader: particleVertex, fragmentShader: particleFragment, transparent: true,
    blending: AdditiveBlending, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uDissolve: dissolve, uRegroup: { value: 0 },
      uDpr: { value: dpr }, uVelocity: { value: 0 } },
  });
  const points = new Points(geometry, pointMaterial);
  // The shader can move particles outside their original CPU bounds.
  points.frustumCulled = false;
  group.add(points);
  let disposed = false;
  return {
    group, points,
    update(time: number, delta: number, progress: number, regroup: number, mouse: Mouse) {
      dissolve.value = progress;
      pointMaterial.uniforms.uTime.value = time;
      pointMaterial.uniforms.uRegroup.value = regroup;
      pointMaterial.uniforms.uVelocity.value = clamp(Math.hypot(mouse.velocityX, mouse.velocityY) / 1500);
      const inverse = 1 - regroup;
      group.rotation.x = damp(group.rotation.x, (.48 + mouse.y * .075) * inverse, 2.5, delta);
      group.rotation.y = damp(group.rotation.y, (-.56 + mouse.x * .12) * inverse, 2.5, delta);
      group.rotation.z = damp(group.rotation.z, -.32 * inverse, 2.5, delta);
      bands.forEach((band, i) => { band.rotation.z = time * (i % 2 ? -.025 : .018) + i * .15; });
      core.rotation.y = time * .035;
      machine.visible = progress < .999 && regroup < .01;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      const geometries = new Set<BufferGeometry>();
      const materials = new Set<Material>();
      group.traverse(object => {
        if (object instanceof Mesh || object instanceof Points) {
          geometries.add(object.geometry);
          (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
          if (object instanceof InstancedMesh) object.dispose();
        }
      });
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      group.clear();
    },
  };
}
