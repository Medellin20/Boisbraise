import type { Metadata } from 'next';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/shared/brand-logo';
import { AdminLoginForm } from '@/components/admin/login-form';

export const metadata: Metadata = { title: 'Administrator-Anmeldung' };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <BrandLogo className="w-40 sm:w-44" priority />
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lifted backdrop-blur-sm sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-center text-lg font-bold text-white">Verwaltungsbereich</h1>
          <p className="mt-1 text-center text-sm text-sand-400">
            Melden Sie sich an, um Produkte, Preise und Fotos zu verwalten.
          </p>

          <div className="mt-6">
            <AdminLoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
