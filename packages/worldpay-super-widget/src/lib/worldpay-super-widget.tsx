import {
  RootWidgetProvider,
  type RootWidgetProviderProps,
} from '@tesouro/embedded-components-react';

export interface WorldpaySuperWidgetProps {
  /** API base URL. Falls back to the global widget config when omitted. */
  baseUrl?: RootWidgetProviderProps['baseUrl'];
  /** Widget auth token. Falls back to the global widget config when omitted. */
  widgetToken?: RootWidgetProviderProps['widgetToken'];
  /** Org ID for data requests. Falls back to the init response when omitted. */
  organizationId?: RootWidgetProviderProps['organizationId'];
}

/**
 * Root of the Worldpay super widget. Owns the single
 * {@link RootWidgetProvider} for the embed, so hosts mount this component and
 * nothing else.
 */
export function WorldpaySuperWidget({
  baseUrl,
  widgetToken,
  organizationId,
}: WorldpaySuperWidgetProps) {
  return (
    <RootWidgetProvider
      baseUrl={baseUrl}
      widgetToken={widgetToken}
      organizationId={organizationId}
    >
      <h1>Welcome to WorldpaySuperWidget!</h1>
    </RootWidgetProvider>
  );
}
