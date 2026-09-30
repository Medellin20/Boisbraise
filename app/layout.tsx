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
    default: 'HolzNest — Vente de bois',
    template: '%s | HolzNest',
  },
  description:
    'Bois de chauffage, grumes et bois de construction. Demandez votre devis et organisez votre livraison.',
  keywords: [
    'vente de bois',
    'bois de chauffage',
    'grumes et billons',
    'bois de construction',
    'livraison de bois',
    'HolzNest',
  ],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'HolzNest',
    title: 'HolzNest — Vente de bois',
    description:
      'Trouvez le bois adapté à votre projet et demandez un devis.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HolzNest — Vente de bois',
    description: 'Bois de chauffage, grumes et bois de construction.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={roboto.variable}>
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
