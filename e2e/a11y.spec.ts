import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const TABS = ['leaderboard', 'fixtures', 'groups', 'teams'];

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(WCAG)
    // Intentional, non-informational broadcast ambiance (WCAG 1.4.3 decoration
    // exception); also aria-hidden, so it reaches no one as content.
    .exclude('[data-decorative]')
    .analyze();
  return results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
}

test.describe('Accessibility (axe)', () => {
  // Reduced motion skips the GSAP reveals, so the DOM is stable when axe runs
  // (and it exercises the prefers-reduced-motion path at the same time).
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  for (const tab of TABS) {
    test(`home (${tab}) has no serious or critical violations`, async ({ page }) => {
      await page.goto(`/?tab=${tab}`);
      await page.waitForLoadState('load');
      await page.waitForTimeout(400);
      const violations = await seriousViolations(page);
      expect(violations, violations.map((v) => v.id).join(', ')).toEqual([]);
    });
  }

  test('draft login has no serious or critical violations', async ({ page }) => {
    await page.goto('/draft/login');
    await page.waitForLoadState('load');
    const violations = await seriousViolations(page);
    expect(violations, violations.map((v) => v.id).join(', ')).toEqual([]);
  });
});
