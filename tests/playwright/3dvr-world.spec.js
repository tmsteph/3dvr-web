import { expect, test } from '@playwright/test';

async function getWorldLayout(page) {
  return page.evaluate(() => {
    const pick = (selector) => {
      const element = document.querySelector(selector);
      if (!element) {
        return null;
      }

      const rect = element.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
      };
    };

    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      scrollWidth: document.documentElement.scrollWidth,
      topbar: pick('.world-topbar'),
      hero: pick('.hero-copy--overlay'),
      frame: pick('#clubFrame'),
      controls: pick('.world-controls'),
      detail: pick('.zone-detail--overlay'),
    };
  });
}

test.describe('3dvr-world page', () => {
  test('renders as a full-screen world and updates zone overlays', async ({ page }) => {
    await page.goto('/3dvr-world/');

    await expect(
      page.getByRole('heading', { name: 'Step into the 3DVR homepage as a full-screen world.' })
    ).toBeVisible();
    await expect(page.locator('.world-topbar')).toBeVisible();
    await expect(page.locator('#clubFrame')).toBeVisible();
    await expect(page.locator('#zoneMetrics .zone-metric')).toHaveCount(3);

    const frameSize = await page.locator('#clubFrame').evaluate((element) => ({
      width: element.clientWidth,
      height: element.clientHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    }));

    expect(frameSize.width).toBeGreaterThan(Math.floor(frameSize.viewportWidth * 0.85));
    expect(frameSize.height).toBeGreaterThan(Math.floor(frameSize.viewportHeight * 0.85));

    const widthState = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));

    expect(widthState.scrollWidth).toBeLessThanOrEqual(widthState.innerWidth + 1);

    await page.locator('button[data-zone-button="rooftop"]').click();
    await expect(page.locator('#statusPill')).toContainText('Portal layer');
    await expect(page.locator('#zoneDepthValue')).toHaveText('79%');
    await expect(page.locator('#zoneMetrics')).toContainText('Portal entry');

    await page.locator('button[data-zone-button="studio"]').click();
    await expect(page.locator('#statusPill')).toContainText('Studio layer');
    await expect(page.locator('#zoneDepthValue')).toHaveText('82%');
    await expect(page.locator('#zoneMetrics')).toContainText('Live experiments');
  });

  test('stacks mobile overlays without collisions on narrow screens', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'firefox-mobile', 'Mobile-only layout check');

    const mobileViewports = [
      { width: 390, height: 844 },
      { width: 360, height: 640 },
      { width: 320, height: 568 },
    ];

    for (const viewport of mobileViewports) {
      await page.setViewportSize(viewport);
      await page.goto('/3dvr-world/');

      const layout = await getWorldLayout(page);

      expect(layout.scrollWidth).toBeLessThanOrEqual(viewport.width + 1);
      expect(layout.topbar).not.toBeNull();
      expect(layout.hero).not.toBeNull();
      expect(layout.frame).not.toBeNull();
      expect(layout.controls).not.toBeNull();
      expect(layout.detail).not.toBeNull();

      expect(layout.topbar.bottom).toBeLessThanOrEqual(layout.hero.top - 12);
      expect(layout.frame.bottom).toBeLessThanOrEqual(layout.controls.top - 8);
      expect(layout.controls.bottom).toBeLessThanOrEqual(layout.detail.top - 8);
      expect(layout.frame.height).toBeGreaterThan(Math.floor(viewport.height * 0.75));
    }
  });
});
