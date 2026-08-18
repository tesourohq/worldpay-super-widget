# @tesouro/worldpay-super-widget

Publishable React library exposing the Worldpay super widget: the embedded
banking `WidgetSuite` behind a provider that owns its own widget-token refresh,
so a host mounts one component and nothing else.

## Usage

Load the stylesheet once, then render the widget:

```tsx
import '@tesouro/worldpay-super-widget/styles.css';
import { WIDGET_SUITE_DEFAULT_SECTIONS, WorldpaySuperWidget } from '@tesouro/worldpay-super-widget';

// Module scope, not an inline arrow: the refresh manager keys on this
// reference, and a new function each render restarts the token lifecycle.
async function fetchWidgetToken() {
  const response = await fetch('/api/widget-token', { method: 'POST' });
  if (!response.ok) throw new Error('Widget token request failed');
  return response.json(); // { widgetToken, exp }
}

<WorldpaySuperWidget baseUrl="https://api.tesouro.com" fetcher={fetchWidgetToken} sections={WIDGET_SUITE_DEFAULT_SECTIONS} />;
```

`react` and `react-dom` (v19) are peer dependencies and must be provided by the
host application.

### The token comes from a fetcher, not a prop

There is no `widgetToken` prop. The widget mounts
`RefreshingRootWidgetProvider`, which owns the token's whole lifecycle: it calls
`fetcher` on mount, holds the result, and calls it again before each token
expires. The host's job is to supply a function that returns
`{ widgetToken, exp }`.

That token is a JWE minted from the partner's **client secret** and **widget
secret**, so `fetcher` must reach a server the host owns — typically a `fetch`
of the host's own route. Minting in the browser would publish both secrets.
[`@tesouro/embedded-components-widget-token`](https://www.npmjs.com/package/@tesouro/embedded-components-widget-token)
mints one server-side and returns exactly the `{ widgetToken, exp }` shape this
expects; `apps/demo` in this repo is a worked example.

`organizationReference` must be resolved server-side too. It drives which
widgets a user can see, so a browser-supplied value would let the caller choose
its own visibility.

### Expiry and refresh have to be chosen together

The manager mints a replacement at `exp - leadSeconds`, and the lead is the
entire window it has to recover a failed mint (its retry backoff is capped at
30s an attempt).

| Setting                                     | Where                 | Value |
| ------------------------------------------- | --------------------- | ----- |
| `expirationInSeconds` (`createWidgetToken`) | The host's mint       | 600   |
| `leadSeconds`                               | This widget's default | 120   |

Those are the numbers the demo runs on: refresh at 480s, with 120s of headroom
before the live token dies. Mint shorter-lived tokens and `leadSeconds` has to
come down with them — a lead at or above the expiry collapses the delay to zero
and re-mints in a loop.

### Sections

`sections` is required with no default. A section listed there is still hidden
when the minted token's scopes do not earn it, so it is the host's ceiling
rather than a promise of what renders. `WIDGET_SUITE_DEFAULT_SECTIONS` is the
whole registry in menu order; `WidgetSuiteSectionId` names them individually.

## Entry points

| Entry point                                 | Contents                                                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `@tesouro/worldpay-super-widget`            | `WorldpaySuperWidget`, `WIDGET_SUITE_DEFAULT_SECTIONS`, `WidgetSuiteSectionId`, `DEFAULT_WIDGET_TOKEN_LEAD_SECONDS` |
| `@tesouro/worldpay-super-widget/styles.css` | The widget stylesheet                                                                                               |

### About the experimental dependency

`WidgetSuite` comes from
`@tesouro/embedded-components-react/experimental/WidgetSuite`. That path sits
outside the package's semver contract — anything on it can change shape or be
removed in a patch release. This package therefore pins
`@tesouro/embedded-components-react` to an **exact** version, and the pin moves
deliberately rather than by range.

### About the stylesheet

The widget renders components from `@tesouro/embedded-components-react`, which
ships its styles as a separate side-effect import rather than injecting them at
runtime. `styles.css` is that stylesheet, copied into this package's `dist/` at
build time from the exact pinned dependency version — so the CSS and the
components it styles always ship as a matched pair, and hosts load one file from
one package.

It is host-safe by design: no global reset, all utilities `ttw`-prefixed, and
Preflight scoped under the `.tesouro-embedded` wrapper each widget renders. It
will not restyle the host page.

Hosts that already import `@tesouro/embedded-components-react/styles.css`
directly should keep doing that and skip this one, to avoid loading the same
rules twice.

## Commands

| Command                              | Description                  |
| ------------------------------------ | ---------------------------- |
| `nx build worldpay-super-widget`     | Bundle to `dist/` via Rollup |
| `nx test worldpay-super-widget`      | Run unit tests via Vitest    |
| `nx lint worldpay-super-widget`      | Run ESLint                   |
| `nx typecheck worldpay-super-widget` | Type-check the library       |
