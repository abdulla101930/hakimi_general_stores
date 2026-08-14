import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const env = {};
for (const raw of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const i = line.indexOf('=');
  if (i < 0) continue;
  let v = line.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[line.slice(0, i).trim()] = v;
}

const BASE = 'http://localhost:4182/hakimi_general_stores/';
const projectId = env.VITE_FIREBASE_PROJECT_ID;
const apiKey = env.VITE_FIREBASE_API_KEY;
const isConfigured = Boolean(projectId) && projectId !== 'your-project-id' && apiKey !== 'your-api-key';
console.log('[workflow] BASE           :', BASE);
console.log('[workflow] Firebase mode  :', isConfigured);
console.log('[workflow] projectId      :', projectId);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const stubs = () => {
  try {
    window.open = () => null;
    window.alert = () => {};
    Object.defineProperty(window, 'Notification', { configurable: true, value: { permission: 'denied', requestPermission: () => Promise.resolve('denied') } });
    const nav = navigator;
    Object.defineProperty(nav, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (ok) => ok({ coords: { latitude: 23.3317, longitude: 75.0365 }, timestamp: Date.now() }),
        watchPosition: (ok) => ok({ coords: { latitude: 23.3317, longitude: 75.0365 }, timestamp: Date.now() }),
        clearWatch: () => {}
      }
    });
  } catch {}
};

let pass = 0, fail = 0;
const ok = (msg) => { console.log('  PASS  ', msg); pass++; };
const bad = (msg) => { console.log('  FAIL  ', msg); fail++; };

// Wait for dev server
for (let i = 0; i < 90; i++) {
  try {
    const r = await fetch(BASE, { method: 'GET' });
    if (r.ok) break;
  } catch {}
  await sleep(2000);
}
console.log('[workflow] dev server ready');

const browser = await chromium.launch();

// ============================================================
// CUSTOMER context
// ============================================================
const customerPhone = '91' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
const custCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await custCtx.addInitScript(stubs);
const cust = await custCtx.newPage();
const custErrors = [];
cust.on('console', (m) => { if (m.type() === 'error') custErrors.push(m.text()); });
cust.on('pageerror', (e) => custErrors.push(String(e)));

console.log('\n--- CUSTOMER: login + place order ---');
await cust.goto(BASE, { waitUntil: 'domcontentloaded' });
await cust.waitForSelector('.product-card', { timeout: 40000 });
console.log('  catalog loaded');
await cust.locator('.blinkit-user-avatar-btn').click();
await cust.locator('input[placeholder="e.g. 1234567890"]').fill(customerPhone);
await cust.locator('input[placeholder="Enter your name"]').fill('Workflow Customer');
await cust.locator('input[placeholder="e.g. House 22, Block B..."]').fill('12, Workflow Lane, Ratlam');
await cust.locator('.login-add-addr-btn').click();
await cust.waitForSelector('.login-addr-row');
await cust.getByRole('button', { name: 'Send OTP Verification' }).click();
await cust.locator('input[placeholder="• • • • • •"]').fill('123456');
await cust.getByRole('button', { name: 'Verify & Log In' }).click();
await cust.waitForSelector('.drawer-backdrop.active', { state: 'detached' }).catch(() => {});
await cust.waitForTimeout(1200);
ok('customer logged in (' + customerPhone + ')');

await cust.locator('.btn-add-action').first().click();
await cust.waitForTimeout(400);
await cust.locator('.magic-list-item').filter({ hasText: 'Cart' }).click();
await cust.waitForSelector('.cart-page-container');
await cust.locator('.btn-place-whatsapp-order').click();
await cust.getByRole('button', { name: 'Cash on Delivery' }).click();
await cust.locator('.pm-cod-btn').click();

await cust.waitForSelector('.tracking-container', { timeout: 40000 });
const subText = await cust.locator('.tracking-header-sub').textContent();
const idMatch = (subText || '').match(/(HKM-\w+)/);
if (!idMatch) { console.log('  header sub:', subText); throw new Error('could not parse order id'); }
const orderId = idMatch[1];
const titlePlaced = await cust.locator('.tracking-header-title').textContent();
if ((titlePlaced || '').includes('Order Submitted')) ok('customer placed order ' + orderId);
else bad('unexpected tracking title: ' + titlePlaced);

// ============================================================
// OWNER context
// ============================================================
const ownerCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ownerCtx.addInitScript(stubs);
const owner = await ownerCtx.newPage();
const ownerErrors = [];
owner.on('console', (m) => { if (m.type() === 'error') ownerErrors.push(m.text()); });
owner.on('pageerror', (e) => ownerErrors.push(String(e)));

console.log('\n--- OWNER: login + accept + status changes ---');
await owner.goto(BASE, { waitUntil: 'domcontentloaded' });
await owner.waitForSelector('.blinkit-user-avatar-btn', { timeout: 30000 });
await owner.locator('.blinkit-user-avatar-btn').click();
await owner.locator('input[placeholder="e.g. 1234567890"]').fill('9993949604');
await owner.getByRole('button', { name: 'Send OTP Verification' }).click();
await owner.locator('input[placeholder="• • • • • •"]').fill('123456');
await owner.getByRole('button', { name: 'Verify & Log In' }).click();
await owner.waitForSelector('.admin-orders-list', { timeout: 30000 });
ok('owner logged in, dashboard shown');

let card = owner.locator('.admin-order-card').filter({ hasText: orderId }).first();
try {
  await card.waitFor({ state: 'visible', timeout: 40000 });
  ok('owner dashboard shows order ' + orderId);
} catch {
  bad('owner dashboard DOES NOT show order ' + orderId + ' (cards: ' + (await owner.locator('.admin-order-card').count()) + ')');
  card = null;
}

if (card) {
  const alarmVisible = await owner.locator('.admin-alarm-banner').isVisible().catch(() => false);
  if (alarmVisible) ok('alarm banner visible');
  else bad('alarm banner NOT visible');

  const statusBefore = await card.locator('.status-dropdown').inputValue();
  if (statusBefore === 'placed') ok('order shows as Placed before accept');
  else bad('unexpected initial status: ' + statusBefore);

  // ---- Accept -> packing ----
  await owner.locator('.admin-accept-btn').first().click();
  await owner.waitForTimeout(2000);
  const statusAfterAccept = await card.locator('.status-dropdown').inputValue();
  if (statusAfterAccept === 'packing') ok('Accept -> status is packing');
  else bad('after accept status is: ' + statusAfterAccept);

  // ---- Customer sees packing ----
  try {
    await cust.waitForFunction(
      () => document.querySelector('.eta-subtext')?.textContent?.includes('packing'),
      null,
      { timeout: 30000 }
    );
    ok('customer sees packing on live tracking');
  } catch {
    bad('customer did NOT see packing (title: ' + (await cust.locator('.tracking-header-title').textContent().catch(() => '?')) + ')');
  }

  // ---- Out for delivery ----
  await card.locator('.status-dropdown').selectOption('out_for_delivery');
  try {
    await cust.waitForFunction(
      () => document.querySelector('.eta-subtext')?.textContent?.includes('on the way'),
      null,
      { timeout: 30000 }
    );
    ok('customer sees On Way (out_for_delivery)');
  } catch {
    bad('customer did NOT see on-the-way');
  }
  const statusOut = await card.locator('.status-dropdown').inputValue();
  if (statusOut === 'out_for_delivery') ok('owner dashboard status -> out_for_delivery');
  else bad('owner dashboard status after select: ' + statusOut);

  // ---- Delivered ----
  await card.locator('.status-dropdown').selectOption('delivered');
  try {
    await cust.waitForFunction(
      () => document.querySelector('.eta-title')?.textContent?.includes('Delivered'),
      null,
      { timeout: 30000 }
    );
    ok('customer sees Delivered');
  } catch {
    bad('customer did NOT see delivered');
  }
  const statusDel = await card.locator('.status-dropdown').inputValue();
  if (statusDel === 'delivered') ok('owner dashboard status -> delivered');
  else bad('owner dashboard status after delivered: ' + statusDel);

  const orderCardCount = await owner.locator('.admin-order-card').count();
  console.log('  owner order cards after full cycle:', orderCardCount);
}

// ============================================================
// Cleanup: delete the test order from Firestore via REST
// ============================================================
if (isConfigured) {
  console.log('\n--- CLEANUP: delete test order from Firestore ---');
  const url =
    'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(projectId) +
    '/databases/(default)/documents/orders/' + encodeURIComponent(orderId) +
    '?key=' + encodeURIComponent(apiKey);
  try {
    const res = await fetch(url, { method: 'DELETE' });
    const txt = await res.text();
    if (res.ok) console.log('  cleanup OK, deleted order', orderId);
    else console.log('  cleanup returned', res.status, txt.slice(0, 160));
  } catch (e) {
    console.log('  cleanup request failed:', String(e));
  }
}

console.log('\n--- SUMMARY ---');
console.log('passed:', pass, ' failed:', fail);
if (custErrors.length) { console.log('customer console errors:'); custErrors.forEach((e) => console.log('   ', e)); }
if (ownerErrors.length) { console.log('owner console errors:'); ownerErrors.forEach((e) => console.log('   ', e)); }

await browser.close();
process.exit(fail > 0 ? 1 : 0);
