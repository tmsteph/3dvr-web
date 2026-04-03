import { defineConfig, devices } from '@playwright/test';

const port = 4173;
const foldClosedViewport = {
  viewport: {
    width: 360,
    height: 808,
  },
  deviceScaleFactor: 3,
  hasTouch: true,
};

export default defineConfig({
  testDir: './tests/playwright',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 8_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `python3 -m http.server ${port} --bind 127.0.0.1`,
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium',
        launchOptions: {
          args: ['--use-gl=swiftshader'],
        },
      },
    },
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        browserName: 'firefox',
      },
    },
    {
      name: 'webkit-desktop-safari',
      use: {
        ...devices['Desktop Safari'],
        browserName: 'webkit',
      },
    },
    {
      name: 'chromium-fold-closed',
      use: {
        browserName: 'chromium',
        ...foldClosedViewport,
        isMobile: true,
        userAgent: devices['Pixel 7'].userAgent,
        launchOptions: {
          args: ['--use-gl=swiftshader'],
        },
      },
    },
    {
      name: 'firefox-fold-closed',
      use: {
        browserName: 'firefox',
        ...foldClosedViewport,
        userAgent:
          'Mozilla/5.0 (Android 14; Mobile; rv:138.0) Gecko/138.0 Firefox/138.0',
      },
    },
    {
      name: 'webkit-mobile-safari',
      use: {
        ...devices['iPhone 13'],
        browserName: 'webkit',
      },
    },
  ],
});
