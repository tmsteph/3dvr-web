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

  test('centers the final hero plan chip when the mobile plan row count is odd', async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo), 'Mobile-only homepage check');

    await page.goto('/');

    const layout = await page.evaluate(() => {
      const grid = document.querySelector('.hero-plan-dock__grid');
      const chips = Array.from(document.querySelectorAll('.hero-plan-chip'));

      if (!grid || chips.length === 0) {
        return null;
      }

      const gridRect = grid.getBoundingClientRect();
      const lastRect = chips.at(-1).getBoundingClientRect();

      return {
        chipCount: chips.length,
        gridCenter: Math.round(gridRect.left + (gridRect.width / 2)),
        lastCenter: Math.round(lastRect.left + (lastRect.width / 2)),
        lastWidth: Math.round(lastRect.width),
        gridWidth: Math.round(gridRect.width),
      };
    });

    expect(layout).not.toBeNull();
    expect(layout.chipCount % 2).toBe(1);
    expect(layout.lastWidth).toBeLessThan(layout.gridWidth);
    expect(Math.abs(layout.lastCenter - layout.gridCenter)).toBeLessThanOrEqual(2);
  });
});
