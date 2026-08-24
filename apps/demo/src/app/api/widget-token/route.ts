import { configureCreateWidgetToken } from '@tesouro/embedded-components-widget-token';
import { NextResponse } from 'next/server';

/*
 * Never prerendered. A prerendered mint would bake one token — and its expiry —
 * into the build output, and it would run `createWidgetToken` at build time,
 * where the secrets below are not the ones the deployed app runs with.
 */
export const dynamic = 'force-dynamic';

/**
 * Paired with `DEFAULT_WIDGET_TOKEN_LEAD_SECONDS` (120) in
 * `@tesouro/worldpay-super-widget`, rather than either side sitting on its
 * default: the provider mints a replacement at `exp - 120`, so a token minted
 * here is refreshed after 480s with 120s of retry headroom before the live one
 * expires. Shorten this and the lead has to come down with it.
 */
const WIDGET_TOKEN_EXPIRATION_SECONDS = 600;

/**
 * Everything the mint needs, and every piece of it server-side.
 *
 * `NEXT_PUBLIC_` appears on none of these on purpose. Two are secrets, and
 * `organizationReference` drives widget visibility through `application-status`
 * — accepting it from the browser would let a caller pick the organization its
 * token is grouped under. The user identity is the demo's stand-in for a real
 * session; a production host reads it from its own signed session instead.
 */
const WIDGET_TOKEN_ENV = {
  clientId: 'TESOURO_CLIENT_ID',
  clientSecret: 'TESOURO_CLIENT_SECRET',
  widgetSecret: 'TESOURO_WIDGET_SECRET',
  organizationReference: 'TESOURO_ORGANIZATION_REFERENCE',
  userId: 'DEMO_USER_ID',
  userEmail: 'DEMO_USER_EMAIL',
} as const;

type WidgetTokenConfig = Record<keyof typeof WIDGET_TOKEN_ENV, string>;

function readWidgetTokenConfig():
  | { ok: true; config: WidgetTokenConfig }
  | { ok: false; missing: string[] } {
  const entries = Object.entries(WIDGET_TOKEN_ENV) as [
    keyof typeof WIDGET_TOKEN_ENV,
    string,
  ][];

  const missing: string[] = [];
  const resolved: Partial<WidgetTokenConfig> = {};

  for (const [key, variable] of entries) {
    const value = process.env[variable]?.trim();
    if (!value) {
      missing.push(variable);
      continue;
    }
    resolved[key] = value;
  }

  if (missing.length > 0) return { ok: false, missing };

  return { ok: true, config: resolved as WidgetTokenConfig };
}

let mintWidgetToken: ReturnType<typeof configureCreateWidgetToken> | undefined;

function getMinter(config: WidgetTokenConfig) {
  // Bound once: the credentials and organization are per-deployment, so only
  // the identity varies per call. Next reloads this module when `.env` changes,
  // so the cache cannot outlive the values it closed over.
  mintWidgetToken ??= configureCreateWidgetToken({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    widgetSecret: config.widgetSecret,
    organizationReference: config.organizationReference,
    expirationInSeconds: WIDGET_TOKEN_EXPIRATION_SECONDS,
  });
  return mintWidgetToken;
}

export async function POST() {
  const resolved = readWidgetTokenConfig();

  if (!resolved.ok) {
    // Names only — a value in a log is a leaked secret.
    console.error(
      'Widget token minting is not configured. Missing environment variables:',
      resolved.missing.join(', '),
    );
    return NextResponse.json(
      { error: 'Widget token minting is not configured' },
      { status: 500 },
    );
  }

  try {
    const { widgetToken, exp } = await getMinter(resolved.config)({
      userId: resolved.config.userId,
      userEmail: resolved.config.userEmail,
    });

    return NextResponse.json(
      { widgetToken, exp },
      // A minted token is per-user and short-lived; nothing between here and
      // the browser should hold a copy.
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    console.error('Widget token creation failed');
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
