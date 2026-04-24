import { test, expect } from '@playwright/test';

// -----------------------------
// 1. Admin login success
// -----------------------------
test('admin can login and access dashboard', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.fill('#email', 'admin@counseling.com');
  await page.fill('#password', 'Admin@1234');

  await page.click('button[type="submit"]');

  // better stability: wait for navigation
  await page.waitForURL(/dashboard/);

  await expect(page).toHaveURL(/dashboard/);
});


// -----------------------------
// 2. Admin logout
// -----------------------------
test('Admin can logout', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.fill('#email', 'admin@counseling.com');
  await page.fill('#password', 'Admin@1234');

  await page.click('button[type="submit"]');

  await page.waitForURL(/dashboard/);

  await page.getByRole('button', { name: /logout/i }).click();

  await expect(page).toHaveURL(/login/);
});


// -----------------------------
// 3. Invalid login error
// -----------------------------
test('Invalid login shows error message', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.fill('#email', 'wrong@email.com');
  await page.fill('#password', 'wrong123');

  await page.click('button[type="submit"]');

  // FIX: use more realistic message (adjust if your UI differs)
  await expect(page.getByText(/invalid|failed|incorrect/i)).toBeVisible();
});


// -----------------------------
// 4. Empty form validation
// -----------------------------
test('Shows validation when fields are empty', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.click('button[type="submit"]');

  // FIX: more realistic validation matching
  await expect(
    page.getByText(/required|email.*required|password.*required/i)
  ).toBeVisible();
});


// -----------------------------
// 5. Dashboard loads after login
// -----------------------------
test('Dashboard loads after login', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.fill('#email', 'admin@counseling.com');
  await page.fill('#password', 'Admin@1234');

  await page.click('button[type="submit"]');

  await page.waitForURL(/dashboard/);

  // FIX: DO NOT check email required here ❌
  await expect(page.getByText(/dashboard/i)).toBeVisible();
});


// -----------------------------
// 6. Admin dashboard redirect
// -----------------------------
test('admin lands on dashboard after login', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.fill('#email', 'admin@counseling.com');
  await page.fill('#password', 'Admin@1234');

  await page.click('button[type="submit"]');

  await page.waitForURL(/admin-dashboard|dashboard/);

  await expect(page).toHaveURL(/dashboard/);
});