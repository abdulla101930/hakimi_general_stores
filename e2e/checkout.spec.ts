import { expect, test } from '@playwright/test';
import { seedPage } from './helpers';

test('guest cart survives login and a full checkout flow', async ({ page }) => {
  await seedPage(page);
  await page.goto('/');

  await page.locator('.btn-add-action').first().click();
  const firstCard = page.locator('.product-card').first();
  await firstCard.locator('.btn-stepper-sub').last().click();
  await expect(page.locator('.magic-cart-badge')).toContainText('2');

  await page.locator('.magic-list-item').filter({ hasText: 'Cart' }).click();
  await expect(page.locator('.cart-page-container')).toBeVisible();
  await expect(page.locator('.cart-item-row-ss5')).toHaveCount(1);
  await expect(page.locator('.stepper-val')).toHaveText('2');

  const selectedInstruction = page.locator('.inst-card-box.active');
  await expect(selectedInstruction).toContainText('No delivery instructions');
  await expect(page.locator('.inst-card-record')).toBeVisible();

  await page.locator('.cart-back-btn').click();

  await page.locator('.blinkit-user-avatar-btn').click();
  await page.locator('input[placeholder="e.g. 1234567890"]').fill('9876543210');
  await page.locator('input[placeholder="Enter your name"]').fill('Test Customer');
  await page.locator('input[placeholder="e.g. House 22, Block B..."]').fill('22, Nehru Nagar, Ratlam');
  await page.locator('.login-add-addr-btn').click();
  await expect(page.locator('.login-addr-row')).toHaveCount(1);
  await page.getByRole('button', { name: 'Send OTP Verification' }).click();

  await page.locator('input[placeholder="• • • • • •"]').fill('123456');
  await page.getByRole('button', { name: 'Verify & Log In' }).click();

  await expect(page.locator('.drawer-backdrop.active')).not.toBeVisible();

  await page.locator('.magic-list-item').filter({ hasText: 'Cart' }).click();
  await expect(page.locator('.cart-item-row-ss5')).toHaveCount(1);
  await expect(page.locator('.cart-item-title')).toContainText('Fresh Farm Tomatoes');

  await page.locator('.btn-place-whatsapp-order').click();
  await page.getByRole('button', { name: 'Cash on Delivery' }).click();
  await page.locator('.pm-cod-btn').click();

  await expect(page.locator('.tracking-container')).toBeVisible();
  await expect(page.locator('.tracking-header-title')).toContainText('Order Submitted');

  const orders = await page.evaluate(() => JSON.parse(localStorage.getItem('hakimi_orders') || '[]'));
  expect(orders).toHaveLength(1);
  expect(orders[0].items).toHaveLength(1);
  expect(orders[0].items[0].weight).toBeTruthy();
  expect(orders[0].instructions).toBeUndefined();
  expect(orders[0].paymentMethod).toBe('COD');
  expect(orders[0].paymentStatus).toBe('Pending');
});
