import { expect, test } from '@playwright/test';
import { seedPage } from './helpers';

test('cart page shows a record-voice instruction and toggles recording on hold', async ({ page }) => {
  await seedPage(page);
  await page.goto('/');

  await page.locator('.btn-add-action').first().click();
  await page.locator('.magic-list-item').filter({ hasText: 'Cart' }).click();
  await expect(page.locator('.cart-item-row-ss5')).toHaveCount(1);

  const recordCard = page.locator('.inst-card-record');
  await expect(recordCard).toBeVisible();
  await expect(recordCard).not.toHaveClass(/recording/);

  await recordCard.hover();
  await page.mouse.down();
  await expect(recordCard).toHaveClass(/recording/, { timeout: 5000 });

  await page.mouse.up();
  await expect(recordCard).not.toHaveClass(/recording/, { timeout: 5000 });
});
