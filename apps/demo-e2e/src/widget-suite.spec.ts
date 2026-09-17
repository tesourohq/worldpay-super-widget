import { expect, test } from '@playwright/test';

import { stubWidgetBackend } from './stubWidgetBackend';

test('has title, and links to the check capture demo', async ({ page }) => {
  await stubWidgetBackend(page);
  await page.goto('/');

  await expect(page.locator('#welcome')).toContainText(
    '@tesouro/worldpay-super-widget demo',
  );

  // Asserted here rather than in `check-capture.spec.ts` so the other page's
  // entry point is covered without a second full mount of this one.
  await expect(
    page.getByRole('link', { name: 'RemoteCheckCapture demo' }),
  ).toHaveAttribute('href', '/check-capture');
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
