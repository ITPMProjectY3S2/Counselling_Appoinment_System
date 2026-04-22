# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: example.spec.js >> Admin can logout
- Location: tests\example.spec.js:19:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button[type="submit"]')
    - locator resolved to <button type="submit">Sign In</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - generic [ref=e7]:
      - img [ref=e8]
      - generic [ref=e12]: MindBridge
    - generic [ref=e13]:
      - heading "Your well-being starts here." [level=1] [ref=e14]:
        - text: Your well-being
        - text: starts here.
      - paragraph [ref=e15]: Connect with certified counselors and take the first step toward a healthier, happier you.
    - generic [ref=e16]:
      - generic [ref=e17]:
        - generic [ref=e18]: 500+
        - generic [ref=e19]: Sessions Done
      - generic [ref=e21]:
        - generic [ref=e22]: 50+
        - generic [ref=e23]: Counselors
      - generic [ref=e25]:
        - generic [ref=e26]: 98%
        - generic [ref=e27]: Satisfaction
  - generic [ref=e29]:
    - generic [ref=e30]:
      - heading "Welcome back" [level=2] [ref=e31]
      - paragraph [ref=e32]: Please enter your credentials to continue
    - generic [ref=e33]:
      - generic [ref=e34]:
        - generic [ref=e35]: Email Address
        - generic [ref=e36]:
          - img
          - textbox "Email Address" [ref=e37]:
            - /placeholder: you@example.com
            - text: admin@counseling.com
      - generic [ref=e38]:
        - generic [ref=e39]: Password
        - generic [ref=e40]:
          - img
          - textbox "Password" [active] [ref=e41]:
            - /placeholder: ••••••••
            - text: Admin@1234
          - button [ref=e42] [cursor=pointer]:
            - img [ref=e43]
      - button "Sign In" [ref=e46] [cursor=pointer]
    - paragraph [ref=e47]:
      - text: Don't have an account?
      - link "Create one here" [ref=e48] [cursor=pointer]:
        - /url: /register
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('admin can login and access dashboard', async ({ page }) => {
  4  | 
  5  |   await page.goto('http://localhost:5173/login'); // adjust port if needed
  6  | 
  7  |   //  Use ID selectors (based on your HTML)
  8  |   await page.fill('#email', 'admin@counseling.com');
  9  |   await page.fill('#password', 'Admin@1234'); // make sure password also has id="password"
  10 | 
  11 |   await page.click('button[type="submit"]');
  12 | 
  13 |   await expect(page).toHaveURL(/dashboard/);
  14 | });
  15 | 
  16 | 
  17 | 
  18 | 
  19 | test('Admin can logout', async ({ page }) => {
  20 |   await page.goto('http://localhost:5173/login');
  21 | 
  22 |   await page.fill('#email', 'admin@counseling.com');
  23 |   await page.fill('#password', 'Admin@1234');
> 24 |   await page.click('button[type="submit"]');
     |              ^ Error: page.click: Test timeout of 30000ms exceeded.
  25 | 
  26 |   // Click logout button (adjust selector)
  27 |   await page.getByRole('button', { name: /logout/i }).click();
  28 | 
  29 |   await expect(page).toHaveURL(/login/);
  30 | });
  31 | 
  32 | 
  33 | 
  34 | 
  35 | 
  36 | test('Invalid login shows error message', async ({ page }) => {
  37 |  await page.goto('http://localhost:5173/login');
  38 | 
  39 |   await page.fill('#email', 'wrong@email.com');
  40 |   await page.fill('#password', 'wrong123');
  41 |   await page.click('button[type="submit"]');
  42 | 
  43 |   await expect(page.getByText(/invalid/i)).toBeVisible();
  44 | });
  45 | 
  46 | 
  47 | 
  48 | 
  49 | test('Shows validation when fields are empty', async ({ page }) => {
  50 |    await page.goto('http://localhost:5173/login');
  51 | 
  52 |   await page.click('button[type="submit"]');
  53 | 
  54 |   await expect(page.getByText(/required/i)).toBeVisible();
  55 | });
  56 | 
  57 | 
  58 | 
  59 | test('Dashboard loads after login', async ({ page }) => {
  60 |   await page.goto('http://localhost:5173/login');
  61 | 
  62 |   await page.fill('#email', 'admin@counseling.com');
  63 |   await page.fill('#password', 'Admin@1234');
  64 |   await page.click('button[type="submit"]');
  65 | 
  66 |   await expect(page.getByText(/dashboard/i)).toBeVisible();
  67 | });
  68 | 
  69 | 
  70 | 
  71 | 
  72 | test('admin lands on dashboard after login', async ({ page }) => {
  73 |   await page.goto('http://localhost:5173/login');
  74 | 
  75 |   await page.fill('#email', 'admin@counseling.com');
  76 |   await page.fill('#password', 'Admin@1234');
  77 |   await page.click('button[type="submit"]');
  78 | 
  79 |   // ✅ just verify redirect
  80 |   await expect(page).toHaveURL(/admin-dashboard/);
  81 | });
```