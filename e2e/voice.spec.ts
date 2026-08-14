import { expect, test } from '@playwright/test';
import { seedPage } from './helpers';

test('cart page delivery instructions default to "No delivery instructions" without a voice option', async ({ page }) => {
  await seedPage(page);
  await page.goto('/');

  await page.locator('.btn-add-action').first().click();
  await page.locator('.magic-list-item').filter({ hasText: 'Cart' }).click();
  await expect(page.locator('.cart-item-row-ss5')).toHaveCount(1);

  await expect(page.locator('.inst-card-box')).toHaveCount(4);
  await expect(page.locator('.inst-card-box.active')).toContainText('No delivery instructions');
  await expect(page.locator('.inst-card-record')).toHaveCount(0);

  await page.locator('.inst-card-box').filter({ hasText: 'Leave at door' }).click();
  await expect(page.locator('.inst-card-box.active')).toContainText('Leave at door');
});
