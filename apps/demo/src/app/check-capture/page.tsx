import Link from 'next/link';

import { resolveTesouroApiBaseUrl } from '../tesouroApiBaseUrl';
import styles from '../page.module.css';
import { RemoteCheckCaptureHost } from './RemoteCheckCaptureHost';

/* Same reason as the index page: `TESOURO_API_BASE_URL` is read per request. */
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'RemoteCheckCapture demo',
  description:
    'The experimental RemoteCheckCaptureWidget behind RefreshingRootWidgetProvider.',
};

export default function CheckCapturePage() {
  const baseUrl = resolveTesouroApiBaseUrl(process.env['TESOURO_API_BASE_URL']);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.pageLink} href="/">
          ← Widget suite demo
        </Link>
        <h1 id="welcome">RemoteCheckCapture demo</h1>
        <p className={styles.subtitle}>
          The experimental <code>RemoteCheckCaptureWidget</code> from{' '}
          <code>@tesouro/embedded-components-react/experimental</code>, on the
          same server-minted widget token as the suite. It renders a Collect
          payment button that opens the capture flow; the button appears only
          when the token earns <code>payment:collect:org</code>,{' '}
          <code>counterpart:read:org</code> and <code>invoice:read:org</code>.
          Capturing a check needs camera
          permission.
        </p>
      </header>

      <main id="remote-check-capture" className={styles.widget}>
        <RemoteCheckCaptureHost baseUrl={baseUrl} />
      </main>
    </div>
  );
}
