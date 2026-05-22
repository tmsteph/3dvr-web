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

  test('keeps the 3D hero logo framed on mobile', async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo), 'Mobile-only homepage check');

    await page.goto('/');
    await page.waitForFunction(() => window.__3dvrLogoToken?.ready === true);
    await page.waitForTimeout(300);

    const layout = await page.evaluate(() => {
      const selectors = [
        '.hero-eyebrow',
        '.hero-token',
        '.hero-brand-wordmark strong',
        '.hero-logo-card--token p',
      ];
      const rects = selectors.map((selector) => {
        const element = document.querySelector(selector);
        const rect = element?.getBoundingClientRect();

        return {
          selector,
          left: Math.round(rect?.left ?? 0),
          right: Math.round(rect?.right ?? 0),
          width: Math.round(rect?.width ?? 0),
        };
      });
      const fallback = document.querySelector('.hero-token__fallback');

      return {
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        fallbackOpacity: Number.parseFloat(getComputedStyle(fallback).opacity),
        rects,
      };
    });

    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
    expect(layout.fallbackOpacity).toBeLessThan(0.1);

    for (const rect of layout.rects) {
      expect(rect.width, `${rect.selector} should render with width`).toBeGreaterThan(0);
      expect(rect.left, `${rect.selector} should not clip left`).toBeGreaterThanOrEqual(0);
      expect(rect.right, `${rect.selector} should not clip right`).toBeLessThanOrEqual(layout.innerWidth);
    }
  });

  test('returns the 3D token to a straight idle spin after interaction', async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo), 'Mobile-only homepage check');

    await page.goto('/');
    await page.waitForFunction(() => window.__3dvrLogoToken?.ready === true);
    await page.waitForTimeout(300);

    const initial = await page.evaluate(() => window.__3dvrLogoToken.getRotation());
    await page.waitForTimeout(900);
    const spinning = await page.evaluate(() => window.__3dvrLogoToken.getRotation());

    expect(Math.abs(initial.manualX)).toBeLessThan(0.02);
    expect(Math.abs(initial.manualY)).toBeLessThan(0.02);
    expect(spinning.idleSpin).toBeGreaterThan(initial.idleSpin + 0.06);

    const token = page.locator('.hero-token');
    const box = await token.boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 95, box.y + box.height / 2 + 48, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(1800);

    const released = await page.evaluate(() => window.__3dvrLogoToken.getRotation());
    expect(Math.abs(released.manualX)).toBeLessThan(0.08);
    expect(Math.abs(released.manualY)).toBeLessThan(0.08);
    expect(released.idleSpin).toBeGreaterThan(spinning.idleSpin);
  });
});
