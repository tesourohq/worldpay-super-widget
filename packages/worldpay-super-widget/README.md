# @tesouro/worldpay-super-widget

Publishable React library exposing the Worldpay super widget.

## Usage

Load the stylesheet once, then render the widget:

```tsx
import '@tesouro/worldpay-super-widget/styles.css';
import { WorldpaySuperWidget } from '@tesouro/worldpay-super-widget';

<WorldpaySuperWidget
  baseUrl="https://api.tesouro.com"
  widgetToken={token}
/>;
```

`react` and `react-dom` (v19) are peer dependencies and must be provided by the
host application.

## Entry points

| Entry point                                | Contents                        |
| ------------------------------------------ | ------------------------------- |
| `@tesouro/worldpay-super-widget`           | `WorldpaySuperWidget`           |
| `@tesouro/worldpay-super-widget/styles.css`| The widget stylesheet           |

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

| Command                                | Description                     |
| -------------------------------------- | ------------------------------- |
| `nx build worldpay-super-widget`       | Bundle to `dist/` via Rollup    |
| `nx test worldpay-super-widget`        | Run unit tests via Vitest       |
| `nx lint worldpay-super-widget`        | Run ESLint                      |
| `nx typecheck worldpay-super-widget`   | Type-check the library          |
