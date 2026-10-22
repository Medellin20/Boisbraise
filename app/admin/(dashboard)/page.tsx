import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminOrderHistory, ADMIN_ORDER_PAGE_SIZE } from '@/lib/data/admin-orders';
import { formatWoodPrice, lengthLabel } from '@/lib/utils/wood';
import { woodDisplayName } from '@/lib/utils/wood-display';

export const metadata: Metadata = { title: 'Tableau de bord · Commandes' };
export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: { page?: string | string[] };
};

export default async function AdminHomePage({ searchParams }: PageProps) {
  const rawPage = searchParams?.page;
  const requestedPage = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  const parsedPage = requestedPage && /^\d+$/.test(requestedPage) ? Number(requestedPage) : 1;
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const { orders, totalCount, error } = await getAdminOrderHistory(page);
  const totalPages = Math.max(1, Math.ceil(totalCount / ADMIN_ORDER_PAGE_SIZE));

  if (!error && page > totalPages) {
    redirect(totalPages === 1 ? '/admin' : `/admin?page=${totalPages}`);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#806344]">HolzNest · Administration</p>
        <h1 className="mt-1 text-2xl font-extrabold text-ink-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-ink-500">Historique des commandes et coordonnées des clients.</p>
      </header>

      {error ? (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">{error}</div>
      ) : (
        <>
          <section aria-label="Résumé des commandes" className="mb-6 rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-ink-500">Commandes enregistrées</p>
            <p className="mt-1 text-3xl font-extrabold text-ink-900">{totalCount}</p>
          </section>

          <section aria-labelledby="order-history-heading" className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4 sm:px-6">
              <div>
                <h2 id="order-history-heading" className="font-bold text-ink-900">Historique des commandes</h2>
                <p className="mt-1 text-sm text-ink-500">Les commandes les plus récentes apparaissent en premier.</p>
              </div>
              {totalCount > 0 && <span className="text-sm text-ink-500">{orders.length} sur {totalCount}</span>}
            </div>

            {orders.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-ink-500">Aucune commande n’a encore été enregistrée.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="bg-sand-100 text-xs uppercase tracking-wide text-ink-500">
                    <tr>
                      <th scope="col" className="px-5 py-3">Date</th>
                      <th scope="col" className="px-5 py-3">Client</th>
                      <th scope="col" className="px-5 py-3">Livraison</th>
                      <th scope="col" className="px-5 py-3">Commande</th>
                      <th scope="col" className="px-5 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {orders.map((order) => (
                      <tr key={order.id} className="align-top">
                        <td className="whitespace-nowrap px-5 py-4 text-ink-600">
                          {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(order.created_at))}
                          <p className="mt-1 text-xs text-ink-400">{order.reference}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-ink-900">{order.customer_first_name} {order.customer_last_name}</p>
                          <a className="mt-1 block text-xs text-ink-600 hover:underline" href={`mailto:${order.customer_email}`}>{order.customer_email}</a>
                          <a className="mt-1 block text-xs text-ink-600 hover:underline" href={`tel:${order.customer_phone}`}>{order.customer_phone}</a>
                        </td>
                        <td className="px-5 py-4 text-ink-700">
                          <p>{order.customer_address}</p>
                          <p>{order.customer_postal_code} {order.customer_city}</p>
                        </td>
                        <td className="max-w-sm px-5 py-4 text-ink-700">
                          <ul className="space-y-1">
                            {order.lines.map((line, index) => (
                              <li key={`${line.slug}-${line.packageCode ?? line.lengthCm}-${index}`}>
                                {line.quantity} × {line.packageLabel ?? 'Unité'} · {woodDisplayName(line.name)} · {lengthLabel(line.lengthCm)}
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 text-xs text-ink-500">Acompte : {formatWoodPrice(order.deposit)} · Paiement : {order.payment_method === 'rib' ? 'virement' : 'lien'}</p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-ink-900">{formatWoodPrice(order.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <nav aria-label="Pages de l’historique" className="flex items-center justify-between border-t border-ink-100 px-5 py-4">
                <Link
                  aria-disabled={page <= 1}
                  tabIndex={page <= 1 ? -1 : undefined}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${page <= 1 ? 'pointer-events-none text-ink-300' : 'text-ink-700 hover:bg-sand-100'}`}
                  href={page <= 2 ? '/admin' : `/admin?page=${page - 1}`}
                >
                  Précédent
                </Link>
                <span className="text-sm text-ink-500">Page {page} sur {totalPages}</span>
                <Link
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-sand-100"
                  href={`/admin?page=${page + 1}`}
                >
                  Suivant
                </Link>
              </nav>
            )}
          </section>
        </>
      )}
    </div>
  );
}
