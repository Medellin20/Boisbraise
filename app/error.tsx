'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="de">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-sand-100 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brick-50 text-brick-500">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-2xl font-extrabold text-ink-900">Ein Fehler ist aufgetreten</h1>
          <p className="mt-2 max-w-md text-ink-500">
            Es ist ein technisches Problem aufgetreten. Bitte versuchen Sie es in Kürze erneut.
          </p>
          <div className="mt-7 flex items-center gap-3">
            <Button onClick={() => reset()}>
              <RefreshCcw className="h-4 w-4" />
              Erneut versuchen
            </Button>
            <Button asChild variant="outline"><Link href="/">Zurück zur Startseite</Link></Button>
          </div>
        </div>
      </body>
    </html>
  );
}
