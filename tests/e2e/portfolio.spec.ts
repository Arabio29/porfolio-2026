import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('identity, keyboard palette and real case-study navigation',async({page})=>{
 const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect(page.locator('#hero-title')).toContainText('SOFTWARE');
 await page.keyboard.press('Control+k');
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('searchbox').fill('projects');
 await page.getByRole('dialog').getByRole('link',{name:'Projects'}).click();
 await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.locator('[data-project-link]').first().click();
 await expect(page).toHaveURL(/projects\/the-living-system/);
 await expect(page.locator('.case-hero h1')).toContainText('The living system');
 await expect(page.locator('#architecture')).toBeVisible();
 await page.goBack();
 await expect(page.locator('#hero-title')).toContainText('SOFTWARE');
 expect(errors).toEqual([]);
});
test('command palette preserves external links in a new tab', async ({ page, context }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await page.getByRole('searchbox').fill('LinkedIn');
  const popup = context.waitForEvent('page');
  await page.getByRole('dialog').getByRole('link', { name: 'LinkedIn' }).click();
  const external = await popup;
  await external.waitForLoadState('domcontentloaded');
  expect(external.url()).toContain('linkedin.com/in/eliasib-cantor-805457231');
  await external.close();
});
test('project links remain clickable while the horizontal work rail is pinned', async ({ page }) => {
  await page.goto('/');
  for (const index of [0, 1, 2, 3]) {
    await page.goto('/');
    const link = page.locator('[data-project-link]').nth(index);
    await link.scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
    const linkBox = await link.boundingBox();
    const windowBox = await page.locator('[data-work-window]').boundingBox();
    expect(linkBox).not.toBeNull();
    expect(windowBox).not.toBeNull();
    const left = Math.max(linkBox!.x + 8, windowBox!.x + 8);
    const right = Math.min(linkBox!.x + linkBox!.width - 8, windowBox!.x + windowBox!.width - 8, 1432);
    const top = Math.max(linkBox!.y + 8, 75);
    const bottom = Math.min(linkBox!.y + linkBox!.height - 8, 892, windowBox!.y + windowBox!.height - 8);
    expect(right).toBeGreaterThan(left);
    expect(bottom).toBeGreaterThan(top);
    await page.mouse.click((left + right) / 2, (top + bottom) / 2);
    await expect(page).toHaveURL(new RegExp(`/projects/${['the-living-system', 'adoction', 'princesas-guerreras', 'prestaya-loans-stack'][index]}/`));
  }
});
test('navigation anchors scroll to every section', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(600);
  for (const id of ['work', 'experience', 'about', 'contact', 'work']) {
    await page.locator(`[data-nav=${id}]`).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect.poll(async () => {
      const top = await page.locator(`#${id}`).evaluate(el => el.getBoundingClientRect().top);
      return Math.abs(top) < 260;
    }, { timeout: 5000 }).toBe(true);
  }
});
test('accessible with reduced motion, no critical or serious violations',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'}); await page.goto('/');
 const a=await new AxeBuilder({page}).analyze();
 expect(a.violations.filter(v=>['critical','serious'].includes(v.impact||''))).toEqual([]);
 await page.locator('[data-skill-node]').first().locator('summary').click();
 await expect(page.locator('[data-skill-node]').first()).toHaveAttribute('open','');
});
test('editorial composition fits six viewport sizes',async({page})=>{
 for(const width of [375,430,768,1024,1440,1920]){
 await page.setViewportSize({width,height:900}); await page.goto('/');
 await page.evaluate(()=>document.fonts.ready);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await expect(page.locator('#hero-title')).toBeVisible();
 }
});
test('content and case study survive disabled JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
  await page.goto('http://127.0.0.1:4321/');await expect(page.locator('#hero-title')).toContainText('SOFTWARE');
  await page.locator('[data-project-link]').first().click();await expect(page.locator('.case-hero h1')).toContainText('The living system');await context.close();
});
