export {
  WorldpaySuperWidget,
  DEFAULT_WIDGET_TOKEN_LEAD_SECONDS,
  type WorldpaySuperWidgetProps,
} from './lib/worldpay-super-widget';

/*
 * The section vocabulary, re-exported so a host that narrows or reorders
 * `sections` can name the ids without taking its own direct dependency on
 * `@tesouro/embedded-components-react` — which it otherwise has no reason to
 * install, since this package wraps it whole.
 *
 * `WIDGET_SUITE_DEFAULT_SECTIONS` is also what `sections` falls back to, so it
 * is worth having on hand to spread and edit rather than retype.
 */
export {
  WIDGET_SUITE_DEFAULT_SECTIONS,
  WidgetSuiteSectionId,
} from '@tesouro/embedded-components-react';
