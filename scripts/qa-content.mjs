import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
const failed = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));
page.on('requestfailed', (request) => failed.push(request.url()));

await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
const home = await page.evaluate(() => ({
  title: document.title,
  description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
  hero: document.querySelector('#hero-title')?.textContent?.trim(),
  projectCount: document.querySelectorAll('[data-project-link]').length,
  externalLinks: [...document.querySelectorAll('a')].filter((link) => link.href.startsWith('http')).map((link) => link.href),
  emailVisible: document.body.textContent?.includes('ecantor.2906@gmail.com'),
  overflow: document.documentElement.scrollWidth <= innerWidth + 1,
  images: [...document.images].map((image) => ({ src: image.currentSrc || image.src, loaded: image.complete && image.naturalWidth > 0 })),
}));

await page.goto('http://127.0.0.1:4321/projects/adoction/', { waitUntil: 'networkidle' });
const caseStudy = await page.evaluate(() => ({
  heading: document.querySelector('.case-hero h1')?.textContent?.trim(),
  source: document.querySelector('.case-source')?.getAttribute('href'),
  metaImage: [...document.querySelectorAll('meta')].find((meta) => meta.getAttribute('property') === 'og:image')?.getAttribute('content'),
  overflow: document.documentElement.scrollWidth <= innerWidth + 1,
  images: [...document.images].map((image) => ({ src: image.currentSrc || image.src, loaded: image.complete && image.naturalWidth > 0 })),
}));

console.log(JSON.stringify({ home, caseStudy, errors, failed }, null, 2));
await browser.close();
