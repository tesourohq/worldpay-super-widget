import { expect, test, type Page } from '@playwright/test';

/**
 * Matches `DEFAULT_TESOURO_API_BASE_URL` in the demo, which is what the app
 * resolves to when `TESOURO_API_BASE_URL` is unset.
 */
const TESOURO_API_ORIGIN = 'https://api.sandbox.stage.tesouro.com';

/**
 * Enough of a widget-init response to earn every section in the registry, so
 * the suite renders its whole menu rather than only the two ungated sections.
 * Scope strings are the ones the section predicates gate on.
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
 * Stands in for the gateway so the suite renders the same way on any machine,
 * with or without partner credentials in the environment. Returns a counter of
 * mint requests, which is how the refresh cycle is observed.
 *
 * Installed before `page.goto`: a route registered after navigation misses the
 * requests the first paint already fired.
 */
async function stubWidgetBackend(page: Page, options: StubOptions = {}) {
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

    // Section panels fetch their own data once mounted. These tests are about
    // the suite's chrome and the token lifecycle, so the rest of the gateway is
    // answered with an empty body rather than left to reach a live host.
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    });
  });

  return mintRequests;
}

test('has title', async ({ page }) => {
  await stubWidgetBackend(page);
  await page.goto('/');

  await expect(page.locator('#welcome')).toContainText(
    '@tesouro/worldpay-super-widget demo',
  );
});

test('renders the widget suite behind a server-minted token', async ({
  page,
}) => {
  const mintRequests = await stubWidgetBackend(page);
  await page.goto('/');

  const suite = page.locator('#worldpay-super-widget');

  // The nav landmark is the shell's own, named by its default labels — proof
  // that `WidgetSuite` mounted rather than just the provider around it.
  const nav = suite.getByRole('navigation', { name: 'Sections' });
  await expect(nav).toBeVisible();

  for (const label of [
    'Dashboard',
    'Accounts',
    'Cards',
    'Transfers',
    'Bill Pay',
    'Invoicing',
    'Expenses',
    'Settings',
  ]) {
    await expect(nav.getByRole('button', { name: label })).toBeVisible();
  }

  // A suite menu is page navigation, not a tab strip: the active item carries
  // `aria-current="page"`, and it starts on the first section listed.
  await expect(nav.getByRole('button', { name: 'Dashboard' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  // The token came from the demo's own route, not from a prop.
  expect(mintRequests.count).toBeGreaterThanOrEqual(1);
});

test('moves between sections from the menu', async ({ page }) => {
  await stubWidgetBackend(page);
  await page.goto('/');

  const nav = page
    .locator('#worldpay-super-widget')
    .getByRole('navigation', { name: 'Sections' });
  await expect(nav).toBeVisible();

  await nav.getByRole('button', { name: 'Cards' }).click();

  await expect(nav.getByRole('button', { name: 'Cards' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(
    nav.getByRole('button', { name: 'Dashboard' }),
  ).not.toHaveAttribute('aria-current', 'page');
});

test('refreshes the widget token before it expires', async ({ page }) => {
  // The refresh manager schedules the next mint at `exp - leadSeconds`. The
  // widget's lead is 120s, so a first token expiring in 5s puts that schedule
  // in the past and the replacement is fetched straight away; the second token
  // is long-lived, so the cycle runs once instead of looping.
  const mintRequests = await stubWidgetBackend(page, {
    firstTokenLifetimeSeconds: 5,
  });
  await page.goto('/');

  const nav = page
    .locator('#worldpay-super-widget')
    .getByRole('navigation', { name: 'Sections' });
  await expect(nav).toBeVisible();

  await expect(() => {
    expect(mintRequests.count).toBeGreaterThanOrEqual(2);
  }).toPass({ timeout: 15_000 });

  // The rotation is transparent: the suite is still mounted on the new token.
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('button', { name: 'Accounts' })).toBeVisible();
});

test('applies the widget stylesheet', async ({ page }) => {
  await stubWidgetBackend(page);
  await page.goto('/');

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

test('keeps the minting secrets out of the client bundle', async ({ page }) => {
  const scriptBodies: Promise<string>[] = [];

  // Registered before navigation so the document's own chunks are captured.
  // A body can be unavailable (redirect, aborted request), which reads as
  // empty rather than failing the test on an unrelated response.
  page.on('response', (response) => {
    if (!new URL(response.url()).pathname.endsWith('.js')) return;
    scriptBodies.push(response.text().catch(() => ''));
  });

  await stubWidgetBackend(page);
  await page.goto('/');
  await expect(
    page
      .locator('#worldpay-super-widget')
      .getByRole('navigation', { name: 'Sections' }),
  ).toBeVisible();

  const sources = await Promise.all(scriptBodies);
  expect(sources.length).toBeGreaterThan(0);

  // What this actually catches: the mint moving to (or being imported by) a
  // client module, which is the way the secrets realistically escape — the
  // package would be bundled and its symbols would appear below. It cannot
  // catch a `NEXT_PUBLIC_` rename on its own, because Next inlines the value
  // and drops the name; the variable names are checked anyway, since a
  // server-only name reaching a client chunk is wrong however it got there.
  for (const source of sources) {
    expect(source).not.toContain('TESOURO_CLIENT_SECRET');
    expect(source).not.toContain('TESOURO_WIDGET_SECRET');
    expect(source).not.toContain('TESOURO_ORGANIZATION_REFERENCE');
    expect(source).not.toContain('configureCreateWidgetToken');
    expect(source).not.toContain('embedded-components-widget-token');
  }
});
