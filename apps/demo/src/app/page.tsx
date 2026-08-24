import { WidgetSuiteHost } from './WidgetSuiteHost';
import { resolveTesouroApiBaseUrl } from './tesouroApiBaseUrl';
import styles from './page.module.css';

/*
 * Rendered per request so `TESOURO_API_BASE_URL` is read from the running
 * environment. Prerendered, this page would bake whichever value the *build*
 * saw into its HTML, and pointing a deployment at another environment would
 * take a rebuild rather than an env change.
 */
export const dynamic = 'force-dynamic';

/*
 * A suite owns the page it sits on, so the host chrome here is deliberately
 * thin: a title bar naming the demo, and the suite under it.
 */
export default function Index() {
  // Read on the server. Not a secret, but there is no reason to publish the
  // environment the demo points at to the browser as its own variable.
  const baseUrl = resolveTesouroApiBaseUrl(process.env['TESOURO_API_BASE_URL']);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 id="welcome">@tesouro/worldpay-super-widget demo</h1>
        <p className={styles.subtitle}>
          <code>WidgetSuite</code> behind{' '}
          <code>RefreshingRootWidgetProvider</code>, authenticated by a widget
          token minted at <code>POST /api/widget-token</code>.
        </p>
      </header>

      <main id="worldpay-super-widget" className={styles.widget}>
        <WidgetSuiteHost baseUrl={baseUrl} />
      </main>
    </div>
  );
}
