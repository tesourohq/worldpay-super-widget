import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('has title', async ({ page }) => {
  // Scoped to #welcome: the widget renders an <h1> too, so a bare h1 locator
  // matches more than one element and trips Playwright's strict mode.
  await expect(page.locator('#welcome h1')).toContainText(
    'Welcome @tesouro/worldpay-super-widget-demo',
  );
});

test('renders the Worldpay super widget', async ({ page }) => {
  await expect(
    page
      .locator('#worldpay-super-widget')
      .getByRole('heading', { name: 'Welcome to WorldpaySuperWidget!' }),
  ).toBeVisible();
});

test('applies the widget stylesheet', async ({ page }) => {
  // The stylesheet is a separate side-effect import re-published by
  // @tesouro/worldpay-super-widget, so a broken export map would still render
  // the markup above while silently dropping every style. Design tokens are
  // declared on :root, which makes them a cheap proof the CSS actually loaded.
  const background = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue('--ttw-background')
      .trim(),
  );

  expect(background).not.toBe('');
});
