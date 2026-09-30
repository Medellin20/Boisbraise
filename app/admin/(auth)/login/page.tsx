import type { Metadata } from 'next';
import { Lock, Home } from 'lucide-react';
import Link from 'next/link';
import { AdminLoginForm } from '@/components/admin/login-form';

export const metadata: Metadata = { title: 'Connexion administrateur' };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
            <Home className="h-4.5 w-4.5 text-white" />
          </span>
          <span className="text-lg font-extrabold text-white">HolzNest</span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lifted backdrop-blur-sm sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-center text-lg font-bold text-white">Espace administrateur</h1>
          <p className="mt-1 text-center text-sm text-sand-400">
            Connectez-vous pour gérer les produits, les tarifs et les photos.
          </p>

          <div className="mt-6">
            <AdminLoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
