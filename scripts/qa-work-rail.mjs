import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const desktopBefore = await page.evaluate(() => {
  const windowElement = document.querySelector('[data-work-window]');
  const track = document.querySelector('[data-horizontal-track]');
  const card = document.querySelector('.project');
  return {
    trackWidth: track?.scrollWidth,
    viewportWidth: windowElement?.clientWidth,
    cardWidth: card?.getBoundingClientRect().width,
    viewport: innerWidth,
  };
});

await page.evaluate(() => {
  const rail = document.querySelector('[data-work-window]');
  const rect = rail?.getBoundingClientRect();
  window.scrollTo(0, (rect?.top || 0) + scrollY - innerHeight * .3 + 20);
});
await page.waitForTimeout(1400);
const desktopAfter = await page.locator('[data-horizontal-track]').evaluate((element) => ({
  transform: getComputedStyle(element).transform,
  dataX: element.dataset.x || '0',
}));

await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const mobile = await page.evaluate(() => {
  const windowElement = document.querySelector('[data-work-window]');
  const track = document.querySelector('[data-horizontal-track]');
  return {
    overflowX: windowElement ? getComputedStyle(windowElement).overflowX : null,
    trackWidth: track?.scrollWidth,
    viewportWidth: windowElement?.clientWidth,
  };
});

console.log(JSON.stringify({ desktopBefore, desktopAfter, mobile }, null, 2));
await browser.close();
