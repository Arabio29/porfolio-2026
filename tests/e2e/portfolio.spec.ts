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
