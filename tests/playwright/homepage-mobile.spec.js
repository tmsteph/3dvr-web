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

  test('stacks the hero quick-start cards cleanly on mobile', async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo), 'Mobile-only homepage check');

    await page.goto('/');

    const layout = await page.evaluate(() => {
      const grid = document.querySelector('.hero-choice-dock__grid');
      const cards = Array.from(document.querySelectorAll('.hero-choice-card'));

      if (!grid || cards.length === 0) {
        return null;
      }

      const gridRect = grid.getBoundingClientRect();
      const cardRects = cards.map((card) => card.getBoundingClientRect());
      const uniqueLefts = new Set(cardRects.map((rect) => Math.round(rect.left)));

      return {
        cardCount: cards.length,
        columnCount: uniqueLefts.size,
        gridWidth: Math.round(gridRect.width),
        widestCard: Math.max(...cardRects.map((rect) => Math.round(rect.width))),
      };
    });

    expect(layout).not.toBeNull();
    expect(layout.cardCount).toBe(2);
    expect(layout.columnCount).toBe(1);
    expect(layout.widestCard).toBeLessThanOrEqual(layout.gridWidth);
  });
});
