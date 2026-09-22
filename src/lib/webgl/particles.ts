/** Seeded buffers: the same source particles survive all narrative chapters. */
export function particleData(count: number) {
  const position = new Float32Array(count * 3);
  const scatter = new Float32Array(count * 3);
  const symbol = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  let state = 2026;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  const paths = [
    [-1.1, .95, -1.8, 0], [-1.8, 0, -1.1, -.95],
    [.4, 1.15, -.4, -1.15],
    [1.1, .95, 1.8, 0], [1.8, 0, 1.1, -.95],
  ];
  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2;
    const tube = random() * Math.PI * 2;
    const ring = i % 3;
    const radius = 1.22 + ring * .48 + Math.cos(tube) * .12;
    position.set([Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sin(tube) * .12 + (ring - 1) * .27], i * 3);
    scatter.set([(random() - .5) * 13, (random() - .5) * 8, (random() - .5) * 5], i * 3);
    const [x1, y1, x2, y2] = paths[i % paths.length];
    const t = random();
    symbol.set([x1 + (x2 - x1) * t + (random() - .5) * .075,
      y1 + (y2 - y1) * t + (random() - .5) * .075, (random() - .5) * .13], i * 3);
    seed[i] = random();
  }
  return { position, scatter, symbol, seed };
}
