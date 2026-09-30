'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { loginAdmin, type AdminLoginState } from '@/actions/admin-auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const initialState: AdminLoginState = { success: false, message: '' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" isLoading={pending}>
      Se connecter
    </Button>
  );
}

export function AdminLoginForm() {
  const [state, formAction] = useFormState(loginAdmin, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="password" className="text-sand-200">
          Mot de passe administrateur
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="border-white/10 bg-white/5 text-white placeholder:text-sand-400 focus:border-white/30"
        />
      </div>

      {state.message && !state.success && (
        <p className="rounded-lg bg-brick-500/15 px-3 py-2 text-sm text-brick-300">{state.message}</p>
      )}

      <SubmitButton />
    </form>
  );
}
