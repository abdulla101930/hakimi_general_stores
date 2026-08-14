import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = 'http://localhost:4179/hakimi_general_stores/';
const OUT = 'shot';
fs.mkdirSync(OUT, { recursive: true });

const tomatoes = {
  id: 'prod-1', name: 'Fresh Farm Tomatoes', price: 35, originalPrice: 50, weight: '500 g',
  mainCategory: 'Food', subCategory: 'veg/fruits', dietaryType: 'veg', inStock: true, image: '🍅',
  availableVariants: [{ weight: '500 g', price: 35, originalPrice: 50 }, { weight: '1 kg', price: 65, originalPrice: 80 }]
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

await page.addInitScript(({ catalog }) => {
  window.open = () => null;
  window.alert = () => {};
  localStorage.setItem('hakimi_catalog', catalog);
}, { catalog: JSON.stringify([
  tomatoes,
  { id: 'prod-9', name: 'Amul Taaza Milk', price: 27, weight: '500 ml', mainCategory: 'Food', subCategory: 'dairy/bread/eggs', dietaryType: 'veg', inStock: true, image: '🥛' },
  { id: 'prod-10', name: 'Farm Fresh White Eggs', price: 48, originalPrice: 55, weight: '6 pcs', mainCategory: 'Food', subCategory: 'dairy/bread/eggs', dietaryType: 'non-veg', inStock: true, image: '🥚' },
  { id: 'prod-21', name: 'Dettol Original Bathing Soap', price: 140, originalPrice: 160, weight: '125g x 3', mainCategory: 'Hygiene', subCategory: 'bath/body', dietaryType: 'none', inStock: true, image: '🧼' },
  { id: 'prod-25', name: 'Surf Excel Detergent Powder', price: 145, originalPrice: 160, weight: '1 kg', mainCategory: 'Hygiene', subCategory: 'detergents', dietaryType: 'none', inStock: true, image: '🧺' }
]) });

page.on('pageerror', (e) => console.log('[pageerror]', String(e)));
page.on('console', (m) => { if (m.type() === 'error') console.log('[console.error]', m.text()); });

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.product-card', { timeout: 30000 });
console.log('cards:', await page.locator('.product-card').count());
await page.screenshot({ path: `${OUT}/1-catalog.png` });

const firstCard = page.locator('.product-card').first();
console.log('first card title:', await firstCard.locator('.product-title-text').textContent());
console.log('first card has variant select:', await firstCard.locator('.product-variant-select').count());
const addBtn = firstCard.locator('.btn-add-action');
console.log('ADD button count:', await addBtn.count());
await addBtn.first().click({ timeout: 5000 }).catch((e) => console.log('ADD click error:', String(e).split('\n')[0]));
await page.waitForTimeout(800);
console.log('qty sheet present:', await page.locator('.qty-sheet-panel').count());
await page.screenshot({ path: `${OUT}/2-after-add.png` });
if (await page.locator('.qty-sheet-panel').count()) {
  await page.locator('.qty-sheet-panel').screenshot({ path: `${OUT}/2-qty-sheet.png` });
}

await browser.close();
console.log('done');
