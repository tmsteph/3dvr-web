import { expect, test } from '@playwright/test';

async function getWorldLayout(page) {
  return page.evaluate(() => {
    const pick = (selector) => {
      const element = document.querySelector(selector);
      if (!element) {
        return null;
      }

      const rect = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);
      return {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
        visible: styles.display !== 'none' && styles.visibility !== 'hidden' && rect.width > 0 && rect.height > 0,
      };
    };

    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      scrollWidth: document.documentElement.scrollWidth,
      topbar: pick('.world-topbar'),
      mobileHint: pick('.world-mobile-hint'),
      intro: pick('.world-intro'),
      frame: pick('#clubFrame'),
      detail: pick('#zoneDetail'),
    };
  });
}

async function swipeWorld(page, startX, startY, endX, endY) {
  await page.locator('#clubFrame').evaluate(
    (element, gesture) => {
      const dispatchTouch = (type, x, y) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        const touches = type === 'touchend' ? [] : [{ clientX: x, clientY: y }];
        Object.defineProperty(event, 'touches', { configurable: true, value: touches });
        Object.defineProperty(event, 'changedTouches', {
          configurable: true,
          value: [{ clientX: x, clientY: y }],
        });
        element.dispatchEvent(event);
      };

      dispatchTouch('touchstart', gesture.startX, gesture.startY);
      dispatchTouch('touchmove', gesture.endX, gesture.endY);
      dispatchTouch('touchend', gesture.endX, gesture.endY);
    },
    { startX, startY, endX, endY }
  );
}

async function activateZone(page, zoneKey) {
  await page.locator(`button[data-zone="${zoneKey}"]`).evaluate((button) => {
    button.click();
  });
}

test.describe('3dvr-world page', () => {
  test('renders as a full-screen world and updates zone overlays', async ({ page }, testInfo) => {
    await page.goto('/3dvr-world/');

    await expect(
      page.getByRole('heading', { name: 'Step into the 3DVR world.' })
    ).toBeVisible();
    if (testInfo.project.name === 'firefox-mobile') {
      await expect(page.locator('.world-topbar')).toBeVisible();
    } else {
      await expect(page.locator('.world-topbar')).not.toBeVisible();
    }
    await expect(page.locator('#clubFrame')).toBeVisible();
    await expect(page.locator('.world-intro')).toBeVisible();
    await expect(page.locator('.world-content')).toBeVisible();
    await expect(page.locator('#zoneMetrics .zone-metric')).toHaveCount(3);
    await expect(page.locator('#statusPill')).toHaveCount(0);
    await expect(page.locator('.world-controls')).toHaveCount(0);
    await expect(page.locator('.world-links')).toHaveCount(0);

    const frameSize = await page.locator('#clubFrame').evaluate((element) => ({
      width: element.clientWidth,
      height: element.clientHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    }));

    expect(frameSize.width).toBeGreaterThan(Math.floor(frameSize.viewportWidth * 0.85));
    expect(frameSize.height).toBeGreaterThan(Math.floor(frameSize.viewportHeight * 0.75));

    const widthState = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));

    expect(widthState.scrollWidth).toBeLessThanOrEqual(widthState.innerWidth + 1);

    if (testInfo.project.name === 'firefox-mobile') {
      await swipeWorld(page, 312, 360, 120, 360);
      await swipeWorld(page, 312, 360, 120, 360);
      await swipeWorld(page, 312, 360, 120, 360);
    } else {
      await activateZone(page, 'rooftop');
    }
    await expect(page.locator('#zoneDetail .zone-detail__eyebrow')).toHaveText('Portal layer');
    await expect(page.locator('#zoneDepthValue')).toHaveText('79%');
    await expect(page.locator('#zoneMetrics')).toContainText('Portal entry');

    if (testInfo.project.name === 'firefox-mobile') {
      await swipeWorld(page, 120, 360, 300, 360);
    } else {
      await activateZone(page, 'studio');
    }
    await expect(page.locator('#zoneDetail .zone-detail__eyebrow')).toHaveText('Studio layer');
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
      expect(layout.topbar.visible).toBe(true);
      expect(layout.mobileHint).not.toBeNull();
      expect(layout.mobileHint.visible).toBe(true);
      expect(layout.intro).not.toBeNull();
      expect(layout.frame).not.toBeNull();
      expect(layout.detail).not.toBeNull();

      expect(layout.topbar.bottom).toBeLessThanOrEqual(layout.frame.bottom - 20);
      expect(layout.mobileHint.bottom).toBeLessThanOrEqual(layout.frame.bottom - 12);
      expect(layout.frame.bottom).toBeLessThanOrEqual(layout.intro.top - 16);
      expect(layout.intro.bottom).toBeLessThanOrEqual(layout.detail.top - 16);
      expect(layout.frame.height).toBeGreaterThan(Math.floor(viewport.height * 0.72));
    }
  });

  test('swipes through zones on touch devices', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'firefox-mobile', 'Mobile-only swipe check');

    await page.goto('/3dvr-world/');

    await swipeWorld(page, 310, 360, 150, 364);

    await expect(page.locator('#zoneDetail .zone-detail__eyebrow')).toHaveText('World layer');
    await expect(page.locator('#zoneDepthValue')).toHaveText('88%');
  });

  test('auto-enables device motion when phone permission is not required', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'firefox-mobile', 'Mobile-only motion check');

    await page.addInitScript(() => {
      class MockDeviceOrientationEvent extends Event {
        constructor(type, init = {}) {
          super(type);
          this.alpha = init.alpha ?? null;
          this.beta = init.beta ?? null;
          this.gamma = init.gamma ?? null;
        }
      }

      Object.defineProperty(window, 'DeviceOrientationEvent', {
        configurable: true,
        writable: true,
        value: MockDeviceOrientationEvent,
      });

      window.__dispatchWorldOrientation = (beta, gamma) => {
        window.dispatchEvent(new MockDeviceOrientationEvent('deviceorientation', { beta, gamma }));
      };
    });

    await page.goto('/3dvr-world/');

    await expect(page.locator('#motionToggle')).toBeHidden();

    await page.evaluate(() => {
      window.__dispatchWorldOrientation(0, 0);
      window.__dispatchWorldOrientation(12, 18);
    });

    await expect.poll(async () => {
      const motion = await page.locator('#clubFrame').evaluate((element) => ({
        tiltX: Number.parseFloat(element.style.getPropertyValue('--tilt-x') || '0'),
        tiltY: Number.parseFloat(element.style.getPropertyValue('--tilt-y') || '0'),
      }));

      return Math.abs(motion.tiltX) + Math.abs(motion.tiltY);
    }).toBeGreaterThan(0.8);
  });

  test('enables device motion on supported phones', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'firefox-mobile', 'Mobile-only motion check');

    await page.addInitScript(() => {
      class MockDeviceOrientationEvent extends Event {
        constructor(type, init = {}) {
          super(type);
          this.alpha = init.alpha ?? null;
          this.beta = init.beta ?? null;
          this.gamma = init.gamma ?? null;
        }

        static async requestPermission() {
          return 'granted';
        }
      }

      Object.defineProperty(window, 'DeviceOrientationEvent', {
        configurable: true,
        writable: true,
        value: MockDeviceOrientationEvent,
      });

      window.__dispatchWorldOrientation = (beta, gamma) => {
        window.dispatchEvent(new MockDeviceOrientationEvent('deviceorientation', { beta, gamma }));
      };
    });

    await page.goto('/3dvr-world/');

    await expect(page.locator('#motionToggle')).toBeVisible();
    await expect(page.locator('#motionState')).toContainText('Enable tilt');

    await page.locator('#motionToggle').click();

    await expect(page.locator('#motionToggle')).toHaveText('Recenter Tilt');
    await expect(page.locator('#motionState')).toContainText('Tilt on');

    await page.evaluate(() => {
      window.__dispatchWorldOrientation(0, 0);
      window.__dispatchWorldOrientation(12, 18);
    });

    await expect.poll(async () => {
      const motion = await page.locator('#clubFrame').evaluate((element) => ({
        tiltX: Number.parseFloat(element.style.getPropertyValue('--tilt-x') || '0'),
        tiltY: Number.parseFloat(element.style.getPropertyValue('--tilt-y') || '0'),
      }));

      return Math.abs(motion.tiltX) + Math.abs(motion.tiltY);
    }).toBeGreaterThan(0.8);

    const motion = await page.locator('#clubFrame').evaluate((element) => ({
      tiltX: Number.parseFloat(element.style.getPropertyValue('--tilt-x') || '0'),
      tiltY: Number.parseFloat(element.style.getPropertyValue('--tilt-y') || '0'),
      floatX: Number.parseFloat(element.style.getPropertyValue('--float-x') || '0'),
      floatY: Number.parseFloat(element.style.getPropertyValue('--float-y') || '0'),
    }));

    expect(Math.abs(motion.tiltX)).toBeGreaterThan(0.6);
    expect(Math.abs(motion.tiltY)).toBeGreaterThan(0.35);
    expect(Math.abs(motion.tiltX)).toBeLessThan(5.2);
    expect(Math.abs(motion.tiltY)).toBeLessThan(3.4);
    expect(Math.abs(motion.floatX)).toBeGreaterThan(2);
    expect(Math.abs(motion.floatY)).toBeGreaterThan(1);
    expect(Math.abs(motion.floatX)).toBeLessThan(15);
    expect(Math.abs(motion.floatY)).toBeLessThan(10);
  });
});
