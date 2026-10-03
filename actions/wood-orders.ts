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
  let link: { url: string } | undefined;
  try {
    const url = new URL(settings.payment_url);
    if (url.protocol === 'https:') link = { url: url.toString() };
  } catch {
    link = undefined;
  }

  const iban = settings.bank_iban.replace(/\s/g, '').toUpperCase();
  const rib = /^[A-Z]{2}[A-Z0-9]{13,32}$/.test(iban) && settings.bank_account_holder
    ? {
      accountHolder: settings.bank_account_holder,
      bankName: settings.bank_name,
      iban,
      bic: settings.bank_bic.replace(/\s/g, '').toUpperCase(),
    }
    : undefined;

  if (settings.payment_method === 'link' && link) {
    return rib ? { method: 'link', link, rib } : { method: 'link', link };
  }
  if (settings.payment_method === 'rib' && rib) {
    return link ? { method: 'rib', link, rib } : { method: 'rib', rib };
  }
  return null;
}

export async function submitWoodOrder(value: unknown): Promise<SubmitOrderResult> {
  const parsed = woodOrderSchema.safeParse(value);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Bitte überprüfen Sie Ihre Bestelldaten.');
  if (parsed.data.website) return fail('Die Bestellung konnte nicht übermittelt werden.');

  const deliveryFeeCents = getDeliveryFeeCents();
  if (deliveryFeeCents == null) {
    return fail('Die Lieferkosten sind nicht eingerichtet. Bitte konfigurieren Sie WOOD_DELIVERY_FEE_EUR in .env.');
  }
  let settingsClient: ReturnType<typeof createAdminClient>;
  try { settingsClient = createAdminClient(); }
  catch { return fail('Die Supabase-Administratorkonfiguration ist unvollständig.'); }
  const { data: paymentSettings, error: settingsError } = await settingsClient
    .from('wood_store_settings').select('payment_method,payment_url,bank_name,bank_account_holder,bank_iban,bank_bic').eq('id', 1).maybeSingle();
  if (settingsError) return fail('Die Zahlungseinstellungen sind nicht verfügbar. Wenden Sie die Supabase-Migration für die Shop-Einstellungen an.');
  const payment = getPaymentDetails(paymentSettings);
  if (!payment) return fail('Die ausgewählte Zahlungsart ist unvollständig. Richten Sie sie unter Verwaltung > Zahlung & Bankverbindung ein.');

  const emailRecipient = process.env.WOOD_ORDER_EMAIL?.trim() || process.env.ALERT_EMAIL?.trim();
  if (!process.env.GMAIL_USER?.trim() || !process.env.GMAIL_APP_PASSWORD?.trim() || !emailRecipient) {
    return fail('Der Bestellversand ist nicht eingerichtet. Bitte konfigurieren Sie GMAIL_USER, GMAIL_APP_PASSWORD und WOOD_ORDER_EMAIL in .env.');
  }

  const supabase = createClient();
  const slugs = [...new Set(parsed.data.lines.map((line) => line.slug))];
  const { data: products, error: productsError } = await supabase
    .from('wood_products')
    .select('id,slug,name,in_stock,stock_m3')
    .in('slug', slugs)
    .eq('is_published', true);
  if (productsError) return fail('Der Katalog ist vorübergehend nicht verfügbar. Bitte versuchen Sie es gleich noch einmal.');
  if (!products?.length || products.length !== slugs.length) return fail('Ein Produkt im Warenkorb ist nicht mehr verfügbar. Bitte aktualisieren Sie den Katalog.');

  const productIds = products.map((product) => product.id);
  const { data: lengths, error: lengthsError } = await supabase
    .from('wood_product_lengths')
    .select('product_id,length_cm,price_per_m3')
    .in('product_id', productIds);
  if (lengthsError) return fail('Die Katalogpreise sind vorübergehend nicht verfügbar.');

  const orderLines: OrderLine[] = [];
  const quantitiesByProduct = new Map<string, number>();
  let subtotalCents = 0;

  for (const requested of parsed.data.lines) {
    const product = products.find((item) => item.slug === requested.slug);
    if (!product || !product.in_stock) return fail(`${product?.name ?? 'Ein Artikel'} ist nicht mehr verfügbar.`);
    const selectedLength = lengths?.find((item) => item.product_id === product.id && item.length_cm === requested.lengthCm);
    if (!selectedLength || selectedLength.price_per_m3 == null) return fail(`Der Preis für ${product.name} (${lengthLabel(requested.lengthCm)}) muss per Angebot bestätigt werden.`);

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
      return fail(`Der Lagerbestand von ${product.name} ist auf ${product.stock_m3} m³ begrenzt.`);
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
    Paiement: payment.method === 'link'
      ? payment.link.url
      : `RIB · ${payment.rib.accountHolder} · ${payment.rib.iban}`,
  }, emailRecipient);

  if (!sent) return fail('Die Bestell-E-Mail konnte nicht gesendet werden. Bitte überprüfen Sie Ihre Gmail-Einstellungen in .env.');
  return { success: true, message: 'Bestellung übermittelt. Die Zahlungsinformationen stehen bereit.', order };
}
