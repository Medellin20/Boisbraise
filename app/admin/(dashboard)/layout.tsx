import { AdminSidebar } from '@/components/admin/sidebar';
import { RefreshOnReturn } from '@/components/layout/refresh-on-return';

// Toutes les pages administrateur lisent des données privées Supabase et
// doivent être rendues à la requête, jamais prégénérées pendant le build.
export const dynamic = 'force-dynamic';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-sand-100 lg:flex-row">
      <RefreshOnReturn />
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 overflow-x-hidden px-3 py-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
