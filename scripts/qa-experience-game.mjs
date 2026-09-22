import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
const experience = page.locator('#experience');
await experience.scrollIntoViewIfNeeded();
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
await page.keyboard.press('r');
await page.waitForTimeout(100);
const reset = await page.locator('[data-game-status]').textContent();
await page.evaluate(() => scrollTo(0, 0));
await page.waitForTimeout(450);
const paused = await page.locator('[data-game-status]').textContent();

console.log(JSON.stringify({ before, moving, reset, paused, errors }, null, 2));
await browser.close();
