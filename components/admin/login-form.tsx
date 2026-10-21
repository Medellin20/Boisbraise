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
    <Button
      type="submit"
      className="w-full bg-[#315b3b] shadow-md hover:bg-[#274a30] active:bg-[#1d3925]"
      size="lg"
      isLoading={pending}
    >
      Anmelden
    </Button>
  );
}

export function AdminLoginForm() {
  const [state, formAction] = useFormState(loginAdmin, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="password" className="text-ink-700">
          Administrator-Passwort
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="border-ink-200 bg-white text-ink-900 placeholder:text-ink-400 focus:border-[#315b3b] focus:ring-[#315b3b]/20"
        />
      </div>

      {state.message && !state.success && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{state.message}</p>
      )}

      <SubmitButton />
    </form>
  );
}
