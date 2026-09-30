'use server';

import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendAdminAlert } from '@/lib/notifications/email';
import { lengthLabel } from '@/lib/utils/wood';
import { woodOrderSchema } from '@/lib/validations/order';
import type { OrderConfirmation, OrderLine, OrderPayment } from '@/lib/types/order';

type SubmitOrderResult =
  | { success: false; message: string }
  | { success: true; message: string; order: OrderConfirmation };

const fail = (message: string): SubmitOrderResult => ({ success: false, message });
const toCents = (value: number) => Math.round(value * 100);
const euros = (cents: number) => cents / 100;
const formatPrice = (cents: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(euros(cents));

function getDeliveryFeeCents(): number | null {
  const value = process.env.WOOD_DELIVERY_FEE_EUR?.trim();
  if (!value) return null;
  const fee = Number(value);
  return Number.isFinite(fee) && fee >= 0 ? toCents(fee) : null;
}

function getPaymentDetails(settings: {
  payment_method: string;
  payment_url: string;
  bank_name: string;
  bank_account_holder: string;
  bank_iban: string;
  bank_bic: string;
} | null): OrderPayment | null {
  if (!settings) return null;
  if (settings.payment_method === 'link' && settings.payment_url) {
    try {
      const url = new URL(settings.payment_url);
      if (url.protocol === 'https:') return { method: 'link', url: url.toString() };
    } catch {}
    return null;
  }
  const iban = settings.bank_iban.replace(/\s/g, '').toUpperCase();
  if (settings.payment_method === 'rib' && iban && settings.bank_account_holder) {
    return {
      method: 'rib',
      accountHolder: settings.bank_account_holder,
      bankName: settings.bank_name,
      iban,
      bic: settings.bank_bic.replace(/\s/g, '').toUpperCase(),
    };
  }
  return null;
}

export async function submitWoodOrder(value: unknown): Promise<SubmitOrderResult> {
  const parsed = woodOrderSchema.safeParse(value);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Vérifiez les informations de la commande.');
  if (parsed.data.website) return fail('La commande n’a pas pu être transmise.');

  const deliveryFeeCents = getDeliveryFeeCents();
  if (deliveryFeeCents == null) {
    return fail('Les frais de livraison ne sont pas configurés. Complétez WOOD_DELIVERY_FEE_EUR dans .env avant de prendre des commandes.');
  }
  let settingsClient: ReturnType<typeof createAdminClient>;
  try { settingsClient = createAdminClient(); }
  catch { return fail('La configuration admin Supabase est incomplète.'); }
  const { data: paymentSettings, error: settingsError } = await settingsClient
    .from('wood_store_settings').select('payment_method,payment_url,bank_name,bank_account_holder,bank_iban,bank_bic').eq('id', 1).maybeSingle();
  if (settingsError) return fail('Les réglages de paiement ne sont pas disponibles. Appliquez la migration Supabase des réglages boutique.');
  const payment = getPaymentDetails(paymentSettings);
  if (!payment) return fail('Le moyen de paiement sélectionné est incomplet. Configurez-le dans Administration > Paiement et RIB.');

  const emailRecipient = process.env.WOOD_ORDER_EMAIL?.trim() || process.env.ALERT_EMAIL?.trim();
  if (!process.env.GMAIL_USER?.trim() || !process.env.GMAIL_APP_PASSWORD?.trim() || !emailRecipient) {
    return fail('L’envoi des commandes n’est pas configuré. Complétez GMAIL_USER, GMAIL_APP_PASSWORD et WOOD_ORDER_EMAIL dans .env.');
  }

  const supabase = createClient();
  const slugs = [...new Set(parsed.data.lines.map((line) => line.slug))];
  const { data: products, error: productsError } = await supabase
    .from('wood_products')
    .select('id,slug,name,in_stock,stock_m3')
    .in('slug', slugs)
    .eq('is_published', true);
  if (productsError) return fail('Le catalogue est momentanément indisponible. Réessayez dans quelques instants.');
  if (!products?.length || products.length !== slugs.length) return fail('Un produit du panier n’est plus disponible. Actualisez le catalogue.');

  const productIds = products.map((product) => product.id);
  const { data: lengths, error: lengthsError } = await supabase
    .from('wood_product_lengths')
    .select('product_id,length_cm,price_per_m3')
    .in('product_id', productIds);
  if (lengthsError) return fail('Les tarifs du catalogue sont momentanément indisponibles.');

  const orderLines: OrderLine[] = [];
  const quantitiesByProduct = new Map<string, number>();
  let subtotalCents = 0;

  for (const requested of parsed.data.lines) {
    const product = products.find((item) => item.slug === requested.slug);
    if (!product || !product.in_stock) return fail(`${product?.name ?? 'Un article'} n’est plus disponible.`);
    const selectedLength = lengths?.find((item) => item.product_id === product.id && item.length_cm === requested.lengthCm);
    if (!selectedLength || selectedLength.price_per_m3 == null) return fail(`Le prix de ${product.name} (${lengthLabel(requested.lengthCm)}) doit être confirmé par devis.`);

    quantitiesByProduct.set(product.id, (quantitiesByProduct.get(product.id) ?? 0) + requested.quantity);
    const unitPriceCents = toCents(Number(selectedLength.price_per_m3));
    const lineTotalCents = unitPriceCents * requested.quantity;
    subtotalCents += lineTotalCents;
    orderLines.push({
      slug: product.slug,
      name: product.name,
      lengthCm: requested.lengthCm,
      quantity: requested.quantity,
      unitPrice: euros(unitPriceCents),
      total: euros(lineTotalCents),
    });
  }

  for (const product of products) {
    const requestedQuantity = quantitiesByProduct.get(product.id) ?? 0;
    if (product.stock_m3 != null && requestedQuantity > product.stock_m3) {
      return fail(`Le stock de ${product.name} est limité à ${product.stock_m3} m³.`);
    }
  }

  const totalCents = subtotalCents + deliveryFeeCents;
  // L’acompte représente exactement 50 % du montant total, livraison comprise.
  const depositCents = Math.round(totalCents / 2);
  const customer = parsed.data.customer;
  const reference = `HN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID().slice(0, 6).toUpperCase()}`;
  const order: OrderConfirmation = {
    reference,
    customer,
    lines: orderLines,
    subtotal: euros(subtotalCents),
    deliveryFee: euros(deliveryFeeCents),
    total: euros(totalCents),
    deposit: euros(depositCents),
    remaining: euros(totalCents - depositCents),
    payment,
  };

  const itemsSummary = orderLines.map((line) =>
    `${line.quantity} m³ — ${line.name}, ${lengthLabel(line.lengthCm)} — ${formatPrice(toCents(line.unitPrice))}/m³ — total ${formatPrice(toCents(line.total))}`
  ).join('\n');
  const sent = await sendAdminAlert(`Nouvelle commande HolzNest ${reference}`, {
    Référence: reference,
    Client: `${customer.firstName} ${customer.lastName}`,
    Adresse: `${customer.address}, ${customer.postalCode} ${customer.city}`,
    Téléphone: customer.phone,
    Email: customer.email,
    Articles: itemsSummary,
    'Sous-total bois': formatPrice(subtotalCents),
    Livraison: formatPrice(deliveryFeeCents),
    'Total commande': formatPrice(totalCents),
    'Acompte à recevoir (50 % du total)': formatPrice(depositCents),
    'Solde restant': formatPrice(totalCents - depositCents),
    Paiement: payment.method === 'link' ? payment.url : `RIB · ${payment.accountHolder} · ${payment.iban}`,
  }, emailRecipient);

  if (!sent) return fail('L’e-mail de commande n’a pas pu être envoyé. Vérifiez vos réglages Gmail dans .env puis réessayez.');
  return { success: true, message: 'Commande transmise. Les instructions de paiement sont prêtes.', order };
}
