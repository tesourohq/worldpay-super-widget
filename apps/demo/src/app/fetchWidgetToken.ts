import type { WidgetTokenFetcher } from '@tesouro/embedded-components-react/lib/WidgetProvider';

/**
 * How long before a token's `exp` the provider mints its replacement, for a
 * host that drives its own provider rather than mounting
 * `WorldpaySuperWidget` (which applies this same value as its default).
 *
 * Paired with `WIDGET_TOKEN_EXPIRATION_SECONDS` in
 * `api/widget-token/route.ts`, which is the other half of the contract: the
 * manager schedules the refresh at `exp - leadSeconds`, so a lead at or above
 * the expiry collapses that delay to zero and re-mints in a loop. Shorten the
 * mint expiry and this has to come down with it.
 *
 * Declared here rather than imported from `@tesouro/worldpay-super-widget`:
 * that package bundles to a single module which pulls in `WidgetSuite`, so
 * importing one integer from it would drag the whole suite into the bundle of
 * any page that does not mount the suite.
 */
export const WIDGET_TOKEN_LEAD_SECONDS = 120;

/**
 * Asks the server to mint a widget JWE. Called once on mount and again by the
 * refresh manager before each token expires.
 *
 * Declared at module scope rather than inside a component: the manager keys on
 * the fetcher's identity, so a fresh closure per render would tear down and
 * restart the token lifecycle on every one. Shared by every host in this demo
 * for the same reason — one module-scope function, not one per page.
 */
export const fetchWidgetToken: WidgetTokenFetcher = async () => {
  const response = await fetch('/api/widget-token', {
    method: 'POST',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error(
      `Widget token request failed with status ${response.status}`,
    );
  }

  const json: unknown = await response.json();
  const payload = json as { widgetToken?: unknown; exp?: unknown };

  if (typeof payload.widgetToken !== 'string' || !payload.widgetToken) {
    throw new Error('Malformed widget token response');
  }

  return {
    widgetToken: payload.widgetToken,
    exp: typeof payload.exp === 'number' ? payload.exp : undefined,
  };
};
