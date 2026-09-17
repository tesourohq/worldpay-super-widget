'use client';

import { WorldpaySuperWidget } from '@tesouro/worldpay-super-widget';

import { fetchWidgetToken } from './fetchWidgetToken';
import type { TesouroApiBaseUrl } from './tesouroApiBaseUrl';

export function WidgetSuiteHost({ baseUrl }: { baseUrl: TesouroApiBaseUrl }) {
  // No `sections`: the demo wants the whole registry, which is what the prop
  // defaults to. Every section is still gated on the minted token's scopes, so
  // the default is a ceiling rather than the menu the user actually gets. Pass
  // the prop to compose a narrower page.
  return <WorldpaySuperWidget baseUrl={baseUrl} fetcher={fetchWidgetToken} />;
}
