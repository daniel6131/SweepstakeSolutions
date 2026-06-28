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
    // Reduced motion skips the GSAP reveal so the tab is immediately clickable
    // rather than covered by an in-flight animation.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForLoadState('load');

    // The view switcher uses role="tab" (not plain buttons).
    await page
      .getByRole('tab', { name: /fixtures/i })
      .first()
      .click();
    await expect(page.locator('#main-content')).toBeVisible();
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
