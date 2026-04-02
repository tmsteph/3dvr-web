import { expect, test } from '@playwright/test';

test.describe('frame-club-test world page', () => {
  test('renders as a full-screen world and updates zone overlays', async ({ page }) => {
    await page.goto('/frame-club-test/');

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
});
