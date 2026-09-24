import { type Page } from '@playwright/test';

/**
 * Matches `DEFAULT_TESOURO_API_BASE_URL` in the demo, which is what the app
 * resolves to when `TESOURO_API_BASE_URL` is unset.
 */
const TESOURO_API_ORIGIN = 'https://api.sandbox.stage.tesouro.com';

/**
 * Enough of a widget-init response to earn every section in the registry, so
 * the suite renders its whole menu rather than only the two ungated sections —
 * plus the scopes `RemoteCheckCaptureWidget`'s own gate
 * (`canCollectRemoteCheckDeposit`) needs that no section does. Scope strings are
 * the ones the predicates gate on.
 */
const INIT_RESPONSE = {
  bankName: 'Demo Bank',
  disclosuresAccepted: true,
  disclosuresRequired: 'NOT_REQUIRED',
  organizationId: '11111111-2222-3333-4444-555555555555',
  organizationTypes: ['EMBEDDED'],
  scopes: [
    'bank_account:read:org',
    'external_bank_account:read:org',
    'credit_card:read:org',
    'debit_card:read:org',
    'payable:read:org',
    'invoice:read:org',
    'expense:read:org',
    'counterpart:read:org',
    'payment:collect:org',
  ],
  status: 'ACTIVE',
  userId: 'demo-user',
  vspName: 'Worldpay',
};

interface StubOptions {
  /**
   * Seconds until the *first* minted token expires. Every later token is
   * long-lived, so a short value here buys exactly one refresh rather than a
   * mint loop.
   */
  firstTokenLifetimeSeconds?: number;
}

/**
 * Stands in for the gateway so the widgets render the same way on any machine,
 * with or without partner credentials in the environment. Returns a counter of
 * mint requests, which is how the refresh cycle is observed.
 *
 * Installed before `page.goto`: a route registered after navigation misses the
 * requests the first paint already fired.
 */
export async function stubWidgetBackend(page: Page, options: StubOptions = {}) {
  const { firstTokenLifetimeSeconds = 3600 } = options;
  const mintRequests = { count: 0 };

  await page.route('**/api/widget-token', async (route) => {
    mintRequests.count += 1;
    const nowSeconds = Math.floor(Date.now() / 1000);
    const lifetime =
      mintRequests.count === 1 ? firstTokenLifetimeSeconds : 3600;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        widgetToken: `stub-widget-token-${mintRequests.count}`,
        exp: nowSeconds + lifetime,
      }),
    });
  });

  await page.route(`${TESOURO_API_ORIGIN}/**`, async (route) => {
    const { pathname } = new URL(route.request().url());

    if (pathname === '/api/widget-gateway/init') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(INIT_RESPONSE),
      });
    }

    // The suite reads the org's application status before its shell renders,
    // and filters the list unguarded, so it needs a real (empty) one.
    if (pathname.endsWith('/embedded-banking/v1/application-status')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ applications: [] }),
      });
    }

    // Panels fetch their own data once mounted. These tests are about the
    // chrome and the token lifecycle, so the rest of the gateway is answered
    // with an empty body rather than left to reach a live host.
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    });
  });

  return mintRequests;
}
