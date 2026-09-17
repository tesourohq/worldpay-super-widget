import { expect, test } from '@playwright/test';

import { stubWidgetBackend } from './stubWidgetBackend';

/**
 * `RemoteCheckCaptureWidget` comes from the `/experimental` entry point while
 * `RefreshingRootWidgetProvider` comes from the package root. They only compose
 * because both resolve to the same shared `WidgetProvider` module — so what is
 * worth proving here is that the widget really does mount pass-through under
 * the root provider, on the root provider's token, rather than sitting there
 * unauthenticated.
 */
test('mounts the experimental check capture widget on a server-minted token', async ({
  page,
}) => {
  const mintRequests = await stubWidgetBackend(page);
  await page.goto('/check-capture');

  await expect(page.locator('#welcome')).toContainText(
    'RemoteCheckCapture demo',
  );

  await expect(
    page.getByTestId('remote-check-capture-widget-root'),
  ).toBeAttached();

  // Gated on `canCollectRemoteCheckDeposit`, which reads the scopes off the
  // init response. It only renders if the widget resolved a token and an init
  // through the provider above it.
  await expect(
    page.getByTestId('remote-check-capture-collect-payment-button'),
  ).toBeVisible();

  expect(mintRequests.count).toBeGreaterThanOrEqual(1);
});
