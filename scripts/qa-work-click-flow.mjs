import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const results = [];

for (let index = 0; index < 4; index += 1) {
  await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
  const link = page.locator('[data-project-link]').nth(index);
  const expected = await link.getAttribute('href');
  await link.scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  const box = await link.boundingBox();
  const windowBox = await page.locator('[data-work-window]').boundingBox();
  if (!box || !windowBox) {
    results.push({ index, error: 'missing bounds' });
    continue;
  }
  const left = Math.max(box.x + 8, windowBox.x + 8);
  const right = Math.min(box.x + box.width - 8, windowBox.x + windowBox.width - 8, 1432);
  const top = Math.max(box.y + 8, 75);
  const bottom = Math.min(box.y + box.height - 8, 892, windowBox.y + windowBox.height - 8);
  if (right <= left || bottom <= top) {
    results.push({ index, error: 'no visible intersection', box, windowBox });
    continue;
  }
  await page.mouse.click((left + right) / 2, (top + bottom) / 2);
  await page.waitForTimeout(500);
  results.push({ index, url: page.url(), expected, click: { left, right, top, bottom } });
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
