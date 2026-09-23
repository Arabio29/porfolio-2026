import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
const experience = page.locator('#experience');
await experience.scrollIntoViewIfNeeded();
// Keep the whole board below the fixed header so screenshots are not clipped.
await experience.evaluate((element) => {
  const top = element.getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, top - 130);
});
await page.waitForTimeout(1200);
const board = page.locator('[data-experience-board]');
const before = await board.evaluate((element) => ({
  available: element.getAttribute('data-game-available'),
  active: element.getAttribute('data-game-active'),
  canvas: Boolean(element.querySelector('canvas')),
}));
await page.keyboard.press('ArrowUp');
await page.waitForTimeout(300);
const moving = await page.locator('[data-game-status]').textContent();

// HUD: sector map (top-left) + animated arrow cluster (bottom-center).
const hudReady = await board.getAttribute('data-game-hud');
await page.keyboard.down('ArrowUp');
await page.waitForTimeout(200);
const keysDown = await board.getAttribute('data-game-keys');
const hudPixels = await page.evaluate(() => {
  const canvas = document.querySelector('[data-experience-game-hud]');
  if (!canvas) return null;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const ratio = canvas.width / Math.max(1, canvas.clientWidth);
  const sample = (x, y, w, h) => {
    const data = context.getImageData(Math.round(x * ratio), Math.round(y * ratio), Math.round(w * ratio), Math.round(h * ratio)).data;
    let opaque = 0;
    for (let index = 3; index < data.length; index += 4) if (data[index] > 16) opaque += 1;
    return opaque;
  };
  const mapSize = Math.round(Math.min(156, Math.max(118, Math.min(canvas.clientWidth, canvas.clientHeight) * .24)));
  const keySize = Math.round(Math.min(46, Math.max(30, Math.min(canvas.clientWidth, canvas.clientHeight) * .075)));
  const keyGap = Math.round(keySize * .2);
  const clusterWidth = keySize * 3 + keyGap * 2;
  const clusterX = Math.round((canvas.clientWidth - clusterWidth) / 2);
  const clusterY = Math.round(canvas.clientHeight - (keySize * 2 + keyGap) - 44);
  return {
    mapPixels: sample(16, 14, mapSize, mapSize),
    upPixels: sample(clusterX + keySize + keyGap, clusterY, keySize, keySize),
    rightPixels: sample(clusterX + 2 * (keySize + keyGap), clusterY + keySize + keyGap, keySize, keySize),
    downPixels: sample(clusterX + keySize + keyGap, clusterY + keySize + keyGap, keySize, keySize),
    leftPixels: sample(clusterX, clusterY + keySize + keyGap, keySize, keySize),
    width: canvas.clientWidth,
    height: canvas.clientHeight,
  };
});
await board.screenshot({ path: 'artifacts/hud-board-pressed.png' });
await page.keyboard.up('ArrowUp');
await page.waitForTimeout(150);
const keysUp = await board.getAttribute('data-game-keys');
await board.screenshot({ path: 'artifacts/hud-board-idle.png' });
const hud = {
  ready: hudReady,
  keysDown,
  keysUp,
  mapPixels: hudPixels?.mapPixels ?? 0,
  upPixels: hudPixels?.upPixels ?? 0,
  rightPixels: hudPixels?.rightPixels ?? 0,
  downPixels: hudPixels?.downPixels ?? 0,
  leftPixels: hudPixels?.leftPixels ?? 0,
  passed: Boolean(
    hudReady === 'ready'
    && keysDown?.includes('arrowup')
    && keysUp === ''
    && (hudPixels?.mapPixels ?? 0) > 2000
    && [hudPixels?.upPixels, hudPixels?.rightPixels, hudPixels?.downPixels, hudPixels?.leftPixels].every((value) => (value ?? 0) > 400),
  ),
};
if (!hud.passed) process.exitCode = 1;

const driveUntilBase = async (key, expected) => {
  await page.keyboard.down(key);
  const deadline = Date.now() + 20000;
  let near = '';
  while (Date.now() < deadline && near !== expected) {
    await page.waitForTimeout(400);
    near = await board.getAttribute('data-game-base');
  }
  await page.keyboard.up(key);
  await page.waitForTimeout(900); // let the camera settle onto the base
  return board.evaluate((element) => ({
    near: element.getAttribute('data-game-base'),
    hidden: element.querySelector('[data-base-panel]').hidden,
    index: element.querySelector('[data-base-index]').textContent,
    discipline: element.querySelector('[data-base-discipline]').textContent,
    name: element.querySelector('[data-base-name]').textContent,
    description: element.querySelector('[data-base-description]').textContent,
    technologies: element.querySelector('[data-base-technologies]').textContent,
    status: element.querySelector('[data-game-status]').textContent,
  }));
};
const reset = async () => {
  await page.keyboard.press('r');
  await page.waitForTimeout(250);
  return board.evaluate((element) => ({
    near: element.getAttribute('data-game-base'),
    hidden: element.querySelector('[data-base-panel]').hidden,
    status: element.querySelector('[data-game-status]').textContent,
  }));
};

// Headless SwiftShader runs well below 60fps, so the sim advances slower than
// wall time — each leg drives until the proximity panel opens.
const base01 = await driveUntilBase('ArrowUp', '01');
await page.screenshot({ path: 'artifacts/final-base-01.png' });
const reset01 = await reset();
const base02 = await driveUntilBase('ArrowRight', '02');
await page.screenshot({ path: 'artifacts/final-base-02.png' });
const reset02 = await reset();
const base03 = await driveUntilBase('ArrowLeft', '03');
await page.screenshot({ path: 'artifacts/final-base-03.png' });
const reset03 = await reset();

// Collision: hold forward from the spawn. The car must reach the base-01 /
// dune pocket and never enter a solid. Radii mirror experience-game.ts
// (dune rx/rz = scale*1.45/scale, base 3.5, cactus .9*scale+.1,
// rock .75*scale), each inflated by carRadius 1.05.
const solids = [
  { x: -9, z: -13, rx: 11.2, rz: 8.05 },
  { x: 4, z: -8, rx: 4.55, rz: 4.55 },
  { x: 8, z: -13, rx: 2.275, rz: 2.275 },
  { x: -6, z: -9, rx: 1.725, rz: 1.725 },
  { x: -7, z: -9, rx: 2.1, rz: 2.1 },
];
await page.keyboard.down('ArrowUp');
const samples = [];
const collisionEnd = Date.now() + 8000;
while (Date.now() < collisionEnd) {
  await page.waitForTimeout(300);
  const rawX = await board.getAttribute('data-car-x');
  const rawZ = await board.getAttribute('data-car-z');
  if (rawX !== null && rawZ !== null) samples.push({ x: Number(rawX), z: Number(rawZ) });
}
await page.keyboard.up('ArrowUp');
await page.waitForTimeout(300);
await page.screenshot({ path: 'artifacts/collision-stop.png' });
const intrusion = samples.find((sample) =>
  solids.some((solid) => Math.hypot((sample.x - solid.x) / solid.rx, (sample.z - solid.z) / solid.rz) < 0.9),
);
const minZ = samples.length ? Math.min(...samples.map((sample) => sample.z)) : 0;
const collision = {
  samples: samples.length,
  minZ,
  movedNorth: minZ <= -3,
  intrusion: intrusion ?? null,
};
collision.passed = collision.samples > 0 && collision.movedNorth && !collision.intrusion;
if (!collision.passed) process.exitCode = 1;
await page.keyboard.press('r');

await page.evaluate(() => scrollTo(0, 0));
await page.waitForTimeout(450);
const paused = await page.locator('[data-game-status]').textContent();

console.log(JSON.stringify({ before, moving, hud, base01, reset01, base02, reset02, base03, reset03, collision, paused, errors }, null, 2));
await browser.close();


