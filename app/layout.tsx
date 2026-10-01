import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import { getSiteUrl } from '@/lib/utils/site-url';
import { PageTransition } from '@/components/layout/page-transition';

const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
  weight: ['300', '400', '500', '700', '900'],
  style: ['normal', 'italic'],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'HolzNest — Holzverkauf',
    template: '%s | HolzNest',
  },
  description:
    'Brennholz, Rundholz und Bauholz. Fordern Sie ein Angebot an und organisieren Sie Ihre Lieferung.',
  keywords: [
    'Holzverkauf',
    'Brennholz',
    'Rundholz und Holzstämme',
    'Bauholz',
    'Holzlieferung',
    'HolzNest',
  ],
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'HolzNest',
    title: 'HolzNest — Holzverkauf',
    description:
      'Finden Sie das passende Holz für Ihr Vorhaben und fordern Sie ein Angebot an.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HolzNest — Holzverkauf',
    description: 'Brennholz, Rundholz und Bauholz.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={roboto.variable}>
      <body className="font-sans">
        <PageTransition>{children}</PageTransition>
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: {
              fontFamily: 'var(--font-roboto)',
            },
          }}
        />
      </body>
    </html>
  );
}
