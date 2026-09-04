'use client';

import { WorldpaySuperWidget } from '@tesouro/worldpay-super-widget';

import type { TesouroApiBaseUrl } from './tesouroApiBaseUrl';

/**
 * Asks the server to mint a widget JWE. Called once on mount and again by the
 * refresh manager before each token expires.
 *
 * Declared at module scope rather than inside the component: the manager keys
 * on the fetcher's identity, so a fresh closure per render would tear down and
 * restart the token lifecycle on every one.
 */
async function fetchWidgetToken(): Promise<{
  widgetToken: string;
  exp?: number;
}> {
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
}

export function WidgetSuiteHost({ baseUrl }: { baseUrl: TesouroApiBaseUrl }) {
  // No `sections`: the demo wants the whole registry, which is what the prop
  // defaults to. Every section is still gated on the minted token's scopes, so
  // the default is a ceiling rather than the menu the user actually gets. Pass
  // the prop to compose a narrower page.
  return <WorldpaySuperWidget baseUrl={baseUrl} fetcher={fetchWidgetToken} />;
}
