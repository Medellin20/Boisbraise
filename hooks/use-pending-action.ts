'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

/** Maintient le verrou pendant toute la requête, y compris avec React 18. */
export function usePendingAction() {
  const [isPending, setIsPending] = useState(false);
  const running = useRef(false);

  const runAction = useCallback((action: () => Promise<void>) => {
    if (running.current) return;
    running.current = true;
    setIsPending(true);
    void (async () => {
      try {
        await action();
      } catch {
        toast.error('Connexion impossible. Merci de réessayer.');
      } finally {
        running.current = false;
        setIsPending(false);
      }
    })();
  }, []);

  return [isPending, runAction] as const;
}
