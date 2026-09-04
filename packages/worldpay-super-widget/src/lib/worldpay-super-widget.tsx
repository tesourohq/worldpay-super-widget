'use client';

import {
  RefreshingRootWidgetProvider,
  WidgetSuite,
  type RefreshingRootWidgetProviderProps,
  type WidgetSuiteProps,
} from '@tesouro/embedded-components-react';

/**
 * How long before a token's `exp` the provider mints its replacement.
 *
 * Deliberately paired with the host's mint expiry rather than left at the
 * package default of 60: the lead is the whole window the refresh manager has
 * to recover a failed mint, and its retry backoff is capped at 30s a try. 120
 * seconds buys several attempts against the 600s expiry the demo mints with,
 * while still spending most of a token's life on the token rather than on
 * re-minting it.
 *
 * A host that mints shorter-lived tokens must lower this to match: the manager
 * schedules the refresh at `exp - leadSeconds`, so a lead at or above the
 * expiry collapses that delay to zero and re-mints in a loop.
 */
export const DEFAULT_WIDGET_TOKEN_LEAD_SECONDS = 120;

export interface WorldpaySuperWidgetProps {
  /**
   * Mints a widget token, and is called again to rotate it before it expires.
   *
   * The token is a JWE minted from the partner's client secret and widget
   * secret, so this must reach a server the host owns — typically a `fetch` of
   * the host's own mint route. Secrets never belong in the browser.
   *
   * Hold the reference stable (module scope, or `useCallback`): the refresh
   * manager is keyed on it, and a new function each render restarts the mint.
   */
  fetcher: RefreshingRootWidgetProviderProps['fetcher'];
  /**
   * Which sections the suite offers, in menu order.
   *
   * Defaults to `WIDGET_SUITE_DEFAULT_SECTIONS` — the whole registry, in the
   * shipped menu order — so the common mount is `fetcher` and nothing else.
   * Name the list to compose a narrower page, or to order it differently.
   *
   * A section listed here is still hidden when the minted token's scopes do not
   * earn it, so this is the ceiling rather than a promise of what renders. That
   * is also what makes the default safe: a section added to the registry
   * upstream reaches a host that took the default, and a user whose token does
   * not earn it still does not see it.
   */
  sections?: WidgetSuiteProps['sections'];
  /** API base URL. Falls back to the global widget config when omitted. */
  baseUrl?: RefreshingRootWidgetProviderProps['baseUrl'];
  /** Org ID for data requests. Falls back to the init response when omitted. */
  organizationId?: RefreshingRootWidgetProviderProps['organizationId'];
  /** See {@link DEFAULT_WIDGET_TOKEN_LEAD_SECONDS}. */
  leadSeconds?: RefreshingRootWidgetProviderProps['leadSeconds'];
}

/**
 * Root of the Worldpay super widget. Owns the single provider for the embed and
 * the token refresh behind it, so hosts mount this component and nothing else.
 */
export function WorldpaySuperWidget({
  fetcher,
  sections,
  baseUrl,
  organizationId,
  leadSeconds = DEFAULT_WIDGET_TOKEN_LEAD_SECONDS,
}: WorldpaySuperWidgetProps) {
  return (
    <RefreshingRootWidgetProvider
      baseUrl={baseUrl}
      fetcher={fetcher}
      leadSeconds={leadSeconds}
      organizationId={organizationId}
    >
      {/*
        No auth props on the suite. Its own `WidgetProvider` then runs in
        pass-through mode, inheriting this provider's client, org and
        `QueryClient` instead of firing a second `/init`, so one init call
        serves every section.

        `sections` is forwarded even when undefined: the suite defaults the
        prop itself, so omitting it here would only duplicate that default in
        a second place for it to drift from.
      */}
      <WidgetSuite sections={sections} />
    </RefreshingRootWidgetProvider>
  );
}
