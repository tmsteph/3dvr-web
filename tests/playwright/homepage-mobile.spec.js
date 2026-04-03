import { expect, test } from '@playwright/test';

function isMobileProject(testInfo) {
  return /(mobile|fold)/i.test(testInfo.project.name);
}

test.describe('homepage mobile sticky CTA', () => {
  test('keeps the sticky CTA out of the hero until the user scrolls', async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo), 'Mobile-only homepage check');

    await page.goto('/');

    const stickyCta = page.locator('.sticky-cta');
    await expect(page.locator('#mobileMenuToggle')).toBeVisible();
    await expect(stickyCta).toBeHidden();

    const widthState = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));

    expect(widthState.scrollWidth).toBeLessThanOrEqual(widthState.innerWidth + 1);

    const heroBottom = await page.locator('.hero').evaluate((element) => (
      Math.round(element.getBoundingClientRect().bottom + window.scrollY)
    ));

    await page.evaluate((scrollTop) => {
      window.scrollTo(0, scrollTop + 40);
    }, heroBottom);

    await expect(stickyCta).toBeVisible();
  });
});
