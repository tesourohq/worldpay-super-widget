import { render, screen, waitFor } from '@testing-library/react';

import { WIDGET_SUITE_DEFAULT_SECTIONS } from '@tesouro/embedded-components-react';

import { WorldpaySuperWidget } from './worldpay-super-widget';

const BASE_URL = 'https://api.sandbox.stage.tesouro.com';

function widgetTokenFetcher() {
  return Promise.resolve({
    widgetToken: 'test-widget-token',
    exp: Math.floor(Date.now() / 1000) + 600,
  });
}

describe('WorldpaySuperWidget', () => {
  beforeEach(() => {
    // The provider fetches `/init` as soon as a token resolves. Nothing here
    // asserts on that response; the stub only keeps the suite off the network.
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ scopes: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render successfully', async () => {
    const { baseElement } = render(
      <WorldpaySuperWidget
        baseUrl={BASE_URL}
        fetcher={widgetTokenFetcher}
        sections={WIDGET_SUITE_DEFAULT_SECTIONS}
      />,
    );

    // Awaited rather than asserted synchronously: the token fetch and the init
    // it triggers both settle after the first paint, and leaving them in flight
    // updates state outside `act`.
    expect(
      await screen.findByRole('navigation', { name: 'Sections' }),
    ).toBeTruthy();
    expect(baseElement).toBeTruthy();
  });

  it('renders the suite shell for the sections it is given', async () => {
    render(
      <WorldpaySuperWidget
        baseUrl={BASE_URL}
        fetcher={widgetTokenFetcher}
        // Both are ungated in the registry, so they render on an unscoped
        // token — which is what this asserts: the shell is composed and
        // mounted, not that any particular entitlement resolved.
        sections={['dashboard', 'settings']}
      />,
    );

    const nav = await screen.findByRole('navigation', { name: 'Sections' });
    expect(nav).toBeTruthy();
    expect(
      await screen.findByRole('button', { name: 'Dashboard' }),
    ).toBeTruthy();
    expect(
      await screen.findByRole('button', { name: 'Settings' }),
    ).toBeTruthy();
  });

  it('falls back to the default section list when none is given', async () => {
    render(
      <WorldpaySuperWidget baseUrl={BASE_URL} fetcher={widgetTokenFetcher} />,
    );

    const nav = await screen.findByRole('navigation', { name: 'Sections' });
    expect(nav).toBeTruthy();

    // The two ungated sections, on an unscoped token. Asserting the fallback
    // resolved to a real list rather than to an empty menu — `sections` is
    // forwarded as `undefined`, so the suite's own default is what fills it.
    expect(
      await screen.findByRole('button', { name: 'Dashboard' }),
    ).toBeTruthy();
    expect(
      await screen.findByRole('button', { name: 'Settings' }),
    ).toBeTruthy();
  });

  it('mints a token through the fetcher rather than taking one as a prop', async () => {
    const fetcher = vi.fn(widgetTokenFetcher);

    render(
      <WorldpaySuperWidget
        baseUrl={BASE_URL}
        fetcher={fetcher}
        sections={['dashboard']}
      />,
    );

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalled();
    });
  });
});
