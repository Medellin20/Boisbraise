import type { OrderLine } from '@/lib/types/order';
import { lengthLabel } from '@/lib/utils/wood';
import { woodDisplayName } from '@/lib/utils/wood-display';
import { getWoodPackage } from '@/lib/utils/wood-packages';

/** Use the confirmed package label, including labels customized in the shop. */
export function orderLineDescription(line: OrderLine): string {
  const quantity = line.packageCode
    ? `${line.quantity} × ${line.packageLabel ?? getWoodPackage(line.packageCode)?.label ?? 'Format'}`
    : `${line.quantity} m³`;
  return `${quantity} · ${woodDisplayName(line.name)} · ${lengthLabel(line.lengthCm)}`;
}
