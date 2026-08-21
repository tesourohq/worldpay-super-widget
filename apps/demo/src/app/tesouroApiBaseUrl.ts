import type { WorldpaySuperWidgetProps } from '@tesouro/worldpay-super-widget';

/**
 * The package types `baseUrl` as a union of the API origins it knows, not as a
 * bare string, so an environment variable has to be narrowed to one of them
 * before it can be handed over.
 */
export type TesouroApiBaseUrl = NonNullable<
  WorldpaySuperWidgetProps['baseUrl']
>;

const TESOURO_API_BASE_URLS = [
  'https://api.tesouro.com',
  'https://api.sandbox.tesouro.com',
  'https://api.business-banking.app',
  'https://api.stage.tesouro.com',
  'https://api.sandbox.stage.tesouro.com',
  'https://api.stage.business-banking.app',
] as const satisfies readonly TesouroApiBaseUrl[];

/** Where the demo credentials are expected to live. */
export const DEFAULT_TESOURO_API_BASE_URL =
  'https://api.sandbox.stage.tesouro.com';

/**
 * Resolves `TESOURO_API_BASE_URL`, rejecting anything outside the known set
 * rather than falling back. A typo that silently reverted to the sandbox would
 * look like a working demo pointed at the wrong environment.
 *
 * Only a genuinely different origin is a typo. A trailing slash or odd casing
 * is a formatting difference — an origin is case-insensitive, and
 * `https://api.tesouro.com/` is an ordinary way to write one — so both are
 * normalized away before matching instead of failing the request.
 */
export function resolveTesouroApiBaseUrl(
  value: string | undefined,
): TesouroApiBaseUrl {
  const trimmed = value?.trim();
  if (!trimmed) return DEFAULT_TESOURO_API_BASE_URL;

  const normalized = trimmed.replace(/\/+$/, '').toLowerCase();
  const match = TESOURO_API_BASE_URLS.find((baseUrl) => baseUrl === normalized);
  if (!match) {
    throw new Error(
      `TESOURO_API_BASE_URL is "${trimmed}", which is not a Tesouro API origin. Expected one of: ${TESOURO_API_BASE_URLS.join(', ')}`,
    );
  }

  return match;
}
