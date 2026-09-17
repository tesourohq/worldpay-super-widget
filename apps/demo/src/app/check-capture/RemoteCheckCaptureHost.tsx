'use client';

import { RefreshingRootWidgetProvider } from '@tesouro/embedded-components-react/lib/WidgetProvider';
import { RemoteCheckCaptureWidget } from '@tesouro/embedded-components-react/experimental';

import {
  WIDGET_TOKEN_LEAD_SECONDS,
  fetchWidgetToken,
} from '../fetchWidgetToken';
import type { TesouroApiBaseUrl } from '../tesouroApiBaseUrl';

/**
 * `RemoteCheckCaptureWidget` is experimental and sits outside the suite, so
 * `@tesouro/worldpay-super-widget` does not wrap it — this page reaches for
 * `@tesouro/embedded-components-react` directly and owns its own root
 * provider. Copy this file rather than `WidgetSuiteHost` when the widget you
 * want is one the package does not re-export.
 *
 * The provider comes from the `/lib/WidgetProvider` entry point, not the
 * package root: the root is a barrel with side-effect imports for every widget
 * and no `sideEffects: false`, so importing from it is unshakeable and lands
 * the whole suite — `@mui/x-data-grid`, `react-pdf` and all — in this page's
 * bundle.
 */
export function RemoteCheckCaptureHost({
  baseUrl,
}: {
  baseUrl: TesouroApiBaseUrl;
}) {
  return (
    <RefreshingRootWidgetProvider
      baseUrl={baseUrl}
      fetcher={fetchWidgetToken}
      leadSeconds={WIDGET_TOKEN_LEAD_SECONDS}
    >
      {/*
        No auth props on the widget, so its own `WidgetProvider` inherits this
        provider's token, org and `QueryClient` rather than firing a second
        `/init`. See the same note in `worldpay-super-widget.tsx`, which mounts
        `WidgetSuite` under the provider the same way.
      */}
      <RemoteCheckCaptureWidget />
    </RefreshingRootWidgetProvider>
  );
}
