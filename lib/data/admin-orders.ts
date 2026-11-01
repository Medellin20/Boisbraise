import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { OrderHistoryRecord } from '@/lib/types/order';

export const ADMIN_ORDER_PAGE_SIZE = 25;

export async function getAdminOrderHistory(page: number): Promise<{
  orders: OrderHistoryRecord[];
  totalCount: number;
  error: string | null;
}> {
  const supabase = createAdminClient();
  const start = (page - 1) * ADMIN_ORDER_PAGE_SIZE;
  const { data, count, error } = await supabase
    .from('wood_orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(start, start + ADMIN_ORDER_PAGE_SIZE - 1);

  if (error) {
    return { orders: [], totalCount: 0, error: 'Der Bestellverlauf ist nicht verfügbar. Wenden Sie die Supabase-Migration 20261022_wood_orders.sql an.' };
  }

  return { orders: data ?? [], totalCount: count ?? 0, error: null };
}
