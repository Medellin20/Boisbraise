import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center py-20">
        <div className="container-app text-center">
          <p className="text-eyebrow text-canal-600">Erreur 404</p>
          <h1 className="mt-3 text-display-md font-extrabold text-ink-900 sm:text-display-lg">
            Seite nicht gefunden
          </h1>
          <p className="mx-auto mt-4 max-w-md text-ink-500">
            Die gesuchte Seite oder das Produkt existiert nicht oder ist nicht mehr verfügbar.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="h-4 w-4" />
                Zurück zur Startseite
              </Link>
            </Button>
            <Button asChild>
              <Link href="/catalogue">
                <Search className="h-4 w-4" />
                Holzkatalog ansehen
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
