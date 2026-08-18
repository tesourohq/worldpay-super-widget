export {
  WorldpaySuperWidget,
  DEFAULT_WIDGET_TOKEN_LEAD_SECONDS,
  type WorldpaySuperWidgetProps,
} from './lib/worldpay-super-widget';

/*
 * The section vocabulary, re-exported so a host can name what it wants on the
 * page without importing the experimental subpath of
 * `@tesouro/embedded-components-react` itself. `sections` is required and
 * typed as a union of ids, so there is no way to call this widget without it.
 */
export {
  WIDGET_SUITE_DEFAULT_SECTIONS,
  WidgetSuiteSectionId,
} from '@tesouro/embedded-components-react/experimental/WidgetSuite';
