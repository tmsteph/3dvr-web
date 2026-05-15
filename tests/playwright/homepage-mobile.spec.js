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

  test('keeps hero plan chips inside the mobile grid', async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo), 'Mobile-only homepage check');

    await page.goto('/');

    const layout = await page.evaluate(() => {
      const grid = document.querySelector('.hero-plan-dock__grid');
      const chips = Array.from(document.querySelectorAll('.hero-plan-chip'));

      if (!grid || chips.length === 0) {
        return null;
      }

      const gridRect = grid.getBoundingClientRect();
      const chipRects = chips.map((chip) => chip.getBoundingClientRect());

      return {
        chipCount: chips.length,
        gridLeft: Math.round(gridRect.left),
        gridRight: Math.round(gridRect.right),
        gridWidth: Math.round(gridRect.width),
        minChipLeft: Math.round(Math.min(...chipRects.map((rect) => rect.left))),
        maxChipRight: Math.round(Math.max(...chipRects.map((rect) => rect.right))),
        maxChipWidth: Math.round(Math.max(...chipRects.map((rect) => rect.width))),
      };
    });

    expect(layout).not.toBeNull();
    expect(layout.chipCount).toBeGreaterThan(0);
    expect(layout.minChipLeft).toBeGreaterThanOrEqual(layout.gridLeft - 1);
    expect(layout.maxChipRight).toBeLessThanOrEqual(layout.gridRight + 1);
    expect(layout.maxChipWidth).toBeLessThan(layout.gridWidth);
  });
});
