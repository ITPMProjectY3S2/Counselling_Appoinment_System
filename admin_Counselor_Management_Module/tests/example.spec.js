import { test, expect } from '@playwright/test';

test('admin can login and access dashboard', async ({ page }) => {

  await page.goto('http://localhost:5173/login'); // adjust port if needed

  //  Use ID selectors (based on your HTML)
  await page.fill('#email', 'admin@counseling.com');
  await page.fill('#password', 'Admin@1234'); // make sure password also has id="password"

  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/dashboard/);
});




test('Admin can logout', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.fill('#email', 'admin@counseling.com');
  await page.fill('#password', 'Admin@1234');
  await page.click('button[type="submit"]');

  // Click logout button (adjust selector)
  await page.getByRole('button', { name: /logout/i }).click();

  await expect(page).toHaveURL(/login/);
});





test('Invalid login shows error message', async ({ page }) => {
 await page.goto('http://localhost:5173/login');

  await page.fill('#email', 'wrong@email.com');
  await page.fill('#password', 'wrong123');
  await page.click('button[type="submit"]');

  await expect(page.getByText(/invalid/i)).toBeVisible();
});




test('Shows validation when fields are empty', async ({ page }) => {
   await page.goto('http://localhost:5173/login');

  await page.click('button[type="submit"]');

  await expect(page.getByText(/required/i)).toBeVisible();
});



test('Dashboard loads after login', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.fill('#email', 'admin@counseling.com');
  await page.fill('#password', 'Admin@1234');
  await page.click('button[type="submit"]');

  await expect(page.getByText(/dashboard/i)).toBeVisible();
});




test('admin lands on dashboard after login', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.fill('#email', 'admin@counseling.com');
  await page.fill('#password', 'Admin@1234');
  await page.click('button[type="submit"]');

  // ✅ just verify redirect
  await expect(page).toHaveURL(/admin-dashboard/);
});