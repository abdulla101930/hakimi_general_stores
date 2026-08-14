import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = 'https://abdulla101930.github.io/hakimi_general_stores';
const OUT = 'shot';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 120)));
page.on('console', (m) => { if (m.type() === 'error') console.log('[console.error]', m.text().slice(0, 120)); });

await page.addInitScript(() => {
  window.open = () => null;
  window.alert = () => {};
});

await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('.product-card', { timeout: 60000 });
await page.waitForTimeout(1500);

// Chawla qty sheet + add 500gm
await page.fill('.blinkit-search-input', 'chawla');
await page.waitForTimeout(600);
await page.locator('.product-card').first().locator('.btn-add-action').click();
await page.waitForSelector('.qty-sheet-panel', { timeout: 10000 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/2-qty-sheet.png` });
await page.locator('.qty-sheet-variant-row').first().locator('.btn-stepper-sub').last().click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/2b-qty-sheet-filled.png` });
await page.locator('.qty-sheet-add-btn').click();
await page.locator('.blinkit-search-clear').click().catch(() => {});
await page.fill('.blinkit-search-input', '');

// Hygiene
await page.locator('.category-theme-card.hygiene-card').click();
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/3-hygiene.png` });

// Cart
await page.locator('.magic-list-item').filter({ hasText: 'Cart' }).click();
await page.waitForSelector('.cart-page-container', { timeout: 10000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/4-cart.png` });

// Login modal
await page.locator('.cart-back-btn').click().catch(() => {});
await page.locator('.blinkit-user-avatar-btn').click();
await page.waitForSelector('.drawer-backdrop.active', { timeout: 10000 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/5-login.png` });

await browser.close();
console.log('done');
