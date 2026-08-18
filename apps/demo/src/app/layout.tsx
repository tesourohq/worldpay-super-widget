import '@tesouro/worldpay-super-widget/styles.css';
import './global.css';

export const metadata = {
  title: '@tesouro/worldpay-super-widget demo',
  description:
    'WidgetSuite behind RefreshingRootWidgetProvider, on a server-minted widget token.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
