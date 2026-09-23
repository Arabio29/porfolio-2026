import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });

async function clickAndRead(selector, name) {
  await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
  const element = page.locator(selector).first();
  const href = await element.getAttribute('href');
  const box = await element.boundingBox();
  const hit = box ? await page.evaluate(({ x, y }) => {
    const target = document.elementFromPoint(x, y);
    return target ? { tag: target.tagName, className: target.className, text: target.textContent?.trim().slice(0, 60) } : null;
  }, { x: box.x + box.width / 2, y: box.y + box.height / 2 }) : null;
  await element.click({ timeout: 8000 });
  await page.waitForTimeout(500);
  return { name, href, url: page.url(), box, hit };
}

const results = [];
results.push(await clickAndRead('[data-nav="work"]', 'work navigation'));
results.push(await clickAndRead('[data-nav="experience"]', 'experience navigation'));
results.push(await clickAndRead('[data-project-link]', 'first project'));

await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
for (const id of ['work', 'experience', 'about', 'contact']) {
  await page.locator(`[data-nav="${id}"]`).click();
  await page.waitForTimeout(180);
  results.push({ name: `${id} anchor`, url: page.url(), sectionTop: await page.locator(`#${id}`).evaluate((element) => Math.round(element.getBoundingClientRect().top)) });
}

await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
for (const selector of ['.social-links a[href^="https://"]', '[data-copy-email]']) {
  const links = await page.locator(selector).evaluateAll((elements) => elements.map((element) => ({
    tag: element.tagName,
    href: element.getAttribute('href'),
    target: element.getAttribute('target'),
    dataCopy: element.getAttribute('data-copy-email'),
  })));
  results.push({ name: `attributes ${selector}`, links });
}

await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
await page.keyboard.press('Control+k');
await page.waitForTimeout(150);
const palette = await page.locator('#command-palette').evaluate((dialog) => ({ open: dialog.open, buttons: dialog.querySelectorAll('a,button').length }));
await page.locator('#command-search').fill('projects');
await page.locator('#command-palette [data-command="Projects"]').click({ timeout: 8000 });
await page.waitForTimeout(500);
results.push({ name: 'palette projects', url: page.url(), palette });

await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
await page.locator('[data-copy-email]').first().scrollIntoViewIfNeeded();
results.push({ name: 'email', href: await page.locator('.contact-email').getAttribute('href'), visible: await page.locator('.contact-email').isVisible() });
console.log(JSON.stringify({ results, errors }, null, 2));
await browser.close();
