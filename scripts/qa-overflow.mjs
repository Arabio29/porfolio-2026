import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
const results = [];
for (const width of [375, 430, 768, 1024, 1440, 1920]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('http://127.0.0.1:4321/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  results.push(await page.evaluate(() => ({
    width: innerWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    containers: ['body', '[data-work-window]', '.work-marquee-heading', '.experience-game-board'].map((selector) => {
      const element = document.querySelector(selector);
      if (!element) return { selector, missing: true };
      const style = getComputedStyle(element);
      return { selector, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth, overflowX: style.overflowX, overflowY: style.overflowY };
    }),
    offenders: [...document.querySelectorAll('*')].map((element) => {
      const rect = element.getBoundingClientRect();
      return { element: element.tagName.toLowerCase(), className: typeof element.className === 'string' ? element.className.slice(0, 100) : '', left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) };
    }).filter((item) => item.right > innerWidth + 1 || item.left < -1).slice(0, 12),
  })));
}
console.log(JSON.stringify(results, null, 2));
await browser.close();
