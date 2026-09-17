export {
  WorldpaySuperWidget,
  DEFAULT_WIDGET_TOKEN_LEAD_SECONDS,
  type WorldpaySuperWidgetProps,
} from './lib/worldpay-super-widget';

/*
 * The section vocabulary, re-exported so a host that narrows or reorders
 * `sections` can name the ids without taking its own direct dependency on
 * `@tesouro/embedded-components-react` — which it has no reason to install to
 * mount the suite, since this package wraps that whole.
 *
 * A host reaching past the suite does still install it: the check-capture demo
 * page mounts an experimental widget this package deliberately does not wrap.
 * That is the line for adding a re-export here — the suite's own vocabulary
 * belongs to this package's API, the rest of the upstream surface does not.
 *
 * `WIDGET_SUITE_DEFAULT_SECTIONS` is also what `sections` falls back to, so it
 * is worth having on hand to spread and edit rather than retype.
 */
export {
  WIDGET_SUITE_DEFAULT_SECTIONS,
  WidgetSuiteSectionId,
} from '@tesouro/embedded-components-react';
