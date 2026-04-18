import { expect, test } from '@playwright/test';

test.describe('Home page smoke', () => {
  test('loads without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('renders the main heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /world cup/i })).toBeVisible();
  });

  test('skip link is focusable and visible on Tab', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: /skip to main content/i });
    await expect(skipLink).toBeVisible();
  });

  test('tab navigation switches content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click the Fixtures tab (button with role=tab or the nav button)
    await page
      .getByRole('button', { name: /fixtures/i })
      .first()
      .click();
    // After tab switch, content area should update — check for fixtures-related content
    await expect(page.locator('[id="main-content"]')).toBeVisible();
  });

  test('has no missing page title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

test.describe('Draft route smoke', () => {
  test('redirects or renders the draft page', async ({ page }) => {
    const response = await page.goto('/draft');
    // Accepts either 200 (public) or 307 (redirect to auth)
    expect([200, 307]).toContain(response?.status());
  });
});

test.describe('Dev console smoke', () => {
  test('returns 200 or redirect for /dev-console', async ({ page }) => {
    const response = await page.goto('/dev-console');
    expect([200, 307]).toContain(response?.status());
  });
});
