# worldpay-super-widget

Home of [`@tesouro/worldpay-super-widget`](./packages/worldpay-super-widget), the
publishable React library that wraps embedded banking's `WidgetSuite`, and of
`apps/demo`, a Next.js host that runs it against a live gateway.

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

| Variable                         | Required | What it is                                                                                                                                                   |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `TESOURO_CLIENT_ID`              | yes      | Partner client id for the RFC 8693 token exchange.                                                                                                           |
| `TESOURO_CLIENT_SECRET`          | yes      | **Secret.** Partner client secret, minted into the JWE payload.                                                                                              |
| `TESOURO_WIDGET_SECRET`          | yes      | **Secret.** Shared key the JWE is encrypted with (`A256KW` + `A256GCM`).                                                                                     |
| `TESOURO_ORGANIZATION_REFERENCE` | yes      | Stable, opaque id for the business the user belongs to. Drives widget visibility via `application-status`.                                                   |
| `DEMO_USER_ID`                   | yes      | The demo's stand-in user identity — it has no login. A real host reads this from its own signed session.                                                     |
| `DEMO_USER_EMAIL`                | yes      | As above.                                                                                                                                                    |
| `TESOURO_API_BASE_URL`           | no       | Which Tesouro API to talk to. Defaults to `https://api.sandbox.stage.tesouro.com`. Rejected unless it is one of the known origins, rather than falling back. |

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

## Nx workspace

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

[Learn more about this workspace setup and its capabilities](https://nx.dev/nx-api/next?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or run `pnpm nx graph` to visually explore what was created.

## Run tasks

To run the dev server for your app, use:

```sh
pnpm nx dev @tesouro/worldpay-super-widget-demo
```

To create a production bundle:

```sh
pnpm nx build @tesouro/worldpay-super-widget-demo
```

To see all available targets to run for a project, run:

```sh
pnpm nx show project @tesouro/worldpay-super-widget-demo
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

```sh
pnpm nx g @nx/next:app demo
```

To generate a new library, use:

```sh
pnpm nx g @nx/react:lib mylib
```

You can use `pnpm nx list` to get a list of installed plugins. Then, run `pnpm nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
pnpm nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
pnpm nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/nx-api/next?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:

- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
