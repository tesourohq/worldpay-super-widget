# @tesouro/worldpay-super-widget

Publishable React library exposing the Worldpay super widget: the embedded
banking `WidgetSuite` behind a provider that owns its own widget-token refresh,
so a host mounts one component and nothing else.

## Usage

Load the stylesheet once, then render the widget:

```tsx
import '@tesouro/worldpay-super-widget/styles.css';
import { WorldpaySuperWidget } from '@tesouro/worldpay-super-widget';

// Module scope, not an inline arrow: the refresh manager keys on this
// reference, and a new function each render restarts the token lifecycle.
async function fetchWidgetToken() {
  const response = await fetch('/api/widget-token', { method: 'POST' });
  if (!response.ok) throw new Error('Widget token request failed');
  return response.json(); // { widgetToken, exp }
}

<WorldpaySuperWidget baseUrl="https://api.tesouro.com" fetcher={fetchWidgetToken} />;
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

`sections` defaults to `WIDGET_SUITE_DEFAULT_SECTIONS` — the whole registry, in
the shipped menu order — so the common mount names only a `fetcher`. Pass the
prop to compose a narrower page, or to order it differently:

```tsx
<WorldpaySuperWidget fetcher={fetchWidgetToken} sections={['dashboard', 'cards', 'settings']} />
```

A section listed there is still hidden when the minted token's scopes do not
earn it, so the list is a ceiling rather than a promise of what renders. That is
what makes the default safe: a section added to the registry upstream reaches a
host that took the default, and a user whose token does not earn it still does
not see it. Pin the list explicitly if you would rather that never happen.

`WIDGET_SUITE_DEFAULT_SECTIONS` is re-exported to spread and edit — `sections={WIDGET_SUITE_DEFAULT_SECTIONS.filter((s) => s !== 'invoicing')}` — and
`WidgetSuiteSectionId` names the ids individually.

## Entry points

| Entry point                                 | Contents                                                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `@tesouro/worldpay-super-widget`            | `WorldpaySuperWidget`, `WIDGET_SUITE_DEFAULT_SECTIONS`, `WidgetSuiteSectionId`, `DEFAULT_WIDGET_TOKEN_LEAD_SECONDS` |
| `@tesouro/worldpay-super-widget/styles.css` | The widget stylesheet                                                                                               |

### About the pinned dependency

`WidgetSuite` is a primary export of `@tesouro/embedded-components-react` as of
`0.3.44`; it previously sat on the unversioned
`/experimental/WidgetSuite` subpath, which no longer resolves.

The dependency is still pinned to an **exact** version, and the pin still moves
deliberately rather than by range. The reason is now the stylesheet rather than
the semver contract: `styles.css` is copied into this package's `dist/` at build
time from whatever version is installed, so a floating range would let the CSS
and the components it styles drift apart between installs.

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
