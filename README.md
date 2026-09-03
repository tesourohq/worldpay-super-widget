# worldpay-super-widget

Home of [`@tesouro/worldpay-super-widget`](./packages/worldpay-super-widget), the
publishable React library that wraps embedded banking's `WidgetSuite`, and of
[`apps/demo`](./apps/demo), a Next.js host that runs it against a live gateway.

## Start here

**[`apps/demo`](./apps/demo) is the worked example.** It is a real host, not a
sketch: it mints a real widget token server-side and mounts the widget against
the live gateway, and the e2e suite keeps it honest. Copy from it rather than
from a snippet.

An integration is four files. Read them in this order:

| #   | File                                                                                           | What it shows                                                                                            |
| --- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | [`apps/demo/.env.example`](./apps/demo/.env.example)                                           | Everything you need to configure, and why none of it may be `NEXT_PUBLIC_`.                              |
| 2   | [`apps/demo/src/app/api/widget-token/route.ts`](./apps/demo/src/app/api/widget-token/route.ts) | **The server mint.** `configureCreateWidgetToken` → `{ widgetToken, exp }`, `force-dynamic`, `no-store`. |
| 3   | [`apps/demo/src/app/WidgetSuiteHost.tsx`](./apps/demo/src/app/WidgetSuiteHost.tsx)             | **The client mount.** One component, plus the module-scope `fetcher` the refresh manager keys on.        |
| 4   | [`apps/demo/src/app/tesouroApiBaseUrl.ts`](./apps/demo/src/app/tesouroApiBaseUrl.ts)           | Narrowing an environment variable to the `baseUrl` union the package accepts.                            |

Then two more, when you want them:

- [`apps/demo-e2e/src/widget-suite.spec.ts`](./apps/demo-e2e/src/widget-suite.spec.ts)
  — how the integration is proven, and how to exercise your own mount with no
  credentials by stubbing the mint at the network layer.
- [`packages/worldpay-super-widget/README.md`](./packages/worldpay-super-widget/README.md)
  — the package's own API: props, entry points, sections, and the expiry/refresh
  contract.

### Repo layout

| Path                                                                 | What it is                                                             |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [`packages/worldpay-super-widget`](./packages/worldpay-super-widget) | The publishable library. The thing you install.                        |
| [`apps/demo`](./apps/demo)                                           | The worked example: a Next.js host wired end to end.                   |
| [`apps/demo-e2e`](./apps/demo-e2e)                                   | Playwright suite covering the demo, including the token refresh cycle. |

## Running the demo

The demo mints a real widget token, so it needs partner credentials. Copy the
template and fill it in:

```sh
cp apps/demo/.env.example apps/demo/.env.local
pnpm nx dev @tesouro/worldpay-super-widget-demo
```

`.env` files are gitignored apart from the template — do not commit real values.

Without credentials the app still starts and the suite still mounts, but
`POST /api/widget-token` answers `500` and no section resolves its entitlements.
The e2e suite stubs the mint and the gateway, so it runs green either way.

### Environment variables

All of these are read on the server only. **None may take a `NEXT_PUBLIC_`
prefix.** Two are secrets, and `TESOURO_ORGANIZATION_REFERENCE` decides which
widgets a user can see — accepting it from the browser would let the caller pick
its own visibility.

| Variable                         | Required | What it is                                                                                                                                                                                                                       |
| -------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TESOURO_CLIENT_ID`              | yes      | Partner client id for the RFC 8693 token exchange.                                                                                                                                                                               |
| `TESOURO_CLIENT_SECRET`          | yes      | **Secret.** Partner client secret, minted into the JWE payload.                                                                                                                                                                  |
| `TESOURO_WIDGET_SECRET`          | yes      | **Secret.** Shared key the JWE is encrypted with (`A256KW` + `A256GCM`).                                                                                                                                                         |
| `TESOURO_ORGANIZATION_REFERENCE` | yes      | Stable, opaque id for the business the user belongs to. Drives widget visibility via `application-status`.                                                                                                                       |
| `DEMO_USER_ID`                   | yes      | The demo's stand-in user identity — it has no login. A real host reads this from its own signed session.                                                                                                                         |
| `DEMO_USER_EMAIL`                | yes      | As above.                                                                                                                                                                                                                        |
| `TESOURO_API_BASE_URL`           | no       | Which Tesouro API to talk to. Defaults to `https://api.sandbox.stage.tesouro.com`. Rejected unless it is one of the known origins, rather than falling back — though a trailing slash or odd casing is normalized, not rejected. |

### How the token gets there

1. `apps/demo/src/app/api/widget-token/route.ts` mints a JWE with
   `configureCreateWidgetToken` from
   `@tesouro/embedded-components-widget-token`, and returns `{ widgetToken, exp }`.
   It is `force-dynamic`, so it is never prerendered with a token baked in.
2. `WidgetSuiteHost` (a client component) passes a `fetch` of that route to
   `WorldpaySuperWidget` as its `fetcher`.
3. `RefreshingRootWidgetProvider` inside the widget calls the fetcher on mount
   and re-calls it at `exp - leadSeconds`, so the token rotates without a reload.

Tokens are minted with `expirationInSeconds: 600` against the widget's
`leadSeconds` default of 120 — refresh at 480s, with 120s of retry headroom.
The two are paired deliberately; see the
[package README](./packages/worldpay-super-widget/README.md) before changing
either.

## Commands

| Command                                               | What it does                   |
| ----------------------------------------------------- | ------------------------------ |
| `pnpm nx dev @tesouro/worldpay-super-widget-demo`     | Run the demo host.             |
| `pnpm nx build @tesouro/worldpay-super-widget-demo`   | Production build of the demo.  |
| `pnpm nx build worldpay-super-widget`                 | Bundle the library to `dist/`. |
| `pnpm nx test worldpay-super-widget`                  | Unit tests.                    |
| `pnpm nx e2e @tesouro/worldpay-super-widget-demo-e2e` | Playwright suite.              |
| `pnpm nx lint worldpay-super-widget`                  | Lint.                          |
| `pnpm nx typecheck worldpay-super-widget`             | Type-check.                    |

Workspace tooling — generators, task running, CI, Nx Console — lives in
[`NX.md`](./NX.md).
