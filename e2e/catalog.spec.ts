import { expect, test } from '@playwright/test';
import { VARIANT_TOMATO, seedPage } from './helpers';

test('renders the product grid as 3 columns', async ({ page }) => {
  await page.goto('/');
  const grid = page.locator('.products-grid');
  await expect(grid).toBeVisible();

  const template = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  expect(template.trim().split(/\s+/)).toHaveLength(3);

  await expect(page.locator('.product-card').first()).toBeVisible();
  const count = await page.locator('.product-card').count();
  expect(count).toBeGreaterThanOrEqual(20);
});

test('search filters the product list', async ({ page }) => {
  await page.goto('/');
  const before = await page.locator('.product-card').count();
  await page.fill('.blinkit-search-input', 'milk');
  await expect(page.locator('.product-card').first()).toBeVisible();
  const after = await page.locator('.product-card').count();
  expect(after).toBeGreaterThan(0);
  expect(after).toBeLessThan(before);
});

test('add to cart updates the badge and the cart page', async ({ page }) => {
  await page.goto('/');
  await page.locator('.btn-add-action').first().click();
  await expect(page.locator('.magic-cart-badge')).toContainText('1');

  await page.locator('.magic-list-item').filter({ hasText: 'Cart' }).click();
  await expect(page.locator('.cart-page-container')).toBeVisible();
  await expect(page.locator('.cart-item-row-ss5')).toHaveCount(1);
  await expect(page.locator('.cart-section-title').first()).toContainText('Items in Cart (1)');
});

test('variant products open a qty picker and add the chosen size', async ({ page }) => {
  await seedPage(page, [VARIANT_TOMATO]);
  await page.goto('/');

  const select = page.locator('.product-variant-select');
  await expect(select).toBeVisible();
  await expect(page.locator('.current-price-val')).toHaveText('₹35');

  await select.selectOption({ label: '1 kg' });
  await expect(page.locator('.current-price-val')).toHaveText('₹65');

  await page.locator('.btn-add-action').click();
  await expect(page.locator('.qty-sheet-panel')).toBeVisible();

  const kgRow = page.locator('.qty-sheet-variant-row').filter({ hasText: '1 kg' });
  await kgRow.locator('.btn-stepper-sub').last().click();
  await expect(page.locator('.qty-sheet-add-btn')).toContainText('1');

  await page.locator('.qty-sheet-add-btn').click();
  await expect(page.locator('.qty-sheet-panel')).toBeHidden();
  await expect(page.locator('.magic-cart-badge')).toContainText('1');

  await page.locator('.magic-list-item').filter({ hasText: 'Cart' }).click();
  await expect(page.locator('.cart-page-container')).toBeVisible();
  await expect(page.locator('.cart-item-row-ss5')).toHaveCount(1);
  await expect(page.locator('.cart-item-unit')).toContainText('1 kg');
});
