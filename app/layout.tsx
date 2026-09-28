import type { Metadata, Viewport } from 'next';
import './globals.css';

// Public files live under the GitHub Pages base path, so PWA links must include it.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const viewport: Viewport = { width: 'device-width', initialScale: 1, interactiveWidget: 'resizes-content', themeColor: '#101713' };
export const metadata: Metadata = {
  title: 'Арена — пространство сильных переговоров',
  description: 'Практикуйте переговоры, пробуйте стратегии и получайте персональный разбор.',
  applicationName: 'Арена переговоров',
  manifest: `${basePath}/manifest.json`,
  appleWebApp: { capable: true, title: 'Арена', statusBarStyle: 'black-translucent' },
  icons: { apple: `${basePath}/apple-touch-icon.png` },
  other: { 'apple-mobile-web-app-capable': 'yes' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ru"><body>{children}</body></html>; }
