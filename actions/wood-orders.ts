'use server';

import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendAdminAlert } from '@/lib/notifications/email';
import { woodDisplayName } from '@/lib/utils/wood-display';
import { lengthLabel } from '@/lib/utils/wood';
import { getWoodPackage } from '@/lib/utils/wood-packages';
import { woodOrderLinesSchema, woodOrderSchema, type WoodOrderInput } from '@/lib/validations/order';
import type { OrderConfirmation, OrderLine, OrderPayment } from '@/lib/types/order';
import { normalizeWoodSalesSettings } from '@/lib/data/wood-sales-settings';

type SubmitOrderResult =
  | { success: false; message: string }
  | { success: true; message: string; order: OrderConfirmation };

const fail = (message: string): SubmitOrderResult => ({ success: false, message });
const toCents = (value: number) => Math.round(value * 100);
const euros = (cents: number) => cents / 100;
const formatPrice = (cents: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(euros(cents));

type PricedCartResult =
  | { success: false; message: string }
  | { success: true; lines: OrderLine[]; subtotalCents: number; deliveryCents: number; deliveryLitres: number; deliveryPricePerLitre: number };

async function priceWoodCart(lines: WoodOrderInput['lines']): Promise<PricedCartResult> {
  const supabase = createClient();
  const slugs = [...new Set(lines.map((line) => line.slug))];
  const { data: products, error: productsError } = await supabase
    .from('wood_products')
    .select('id,slug,name,in_stock,stock_m3')
    .in('slug', slugs)
    .eq('is_published', true);
  if (productsError) return { success: false, message: 'Der Katalog ist vorübergehend nicht verfügbar. Versuchen Sie es in Kürze erneut.' };
  if (!products?.length || products.length !== slugs.length) {
    return { success: false, message: 'Ein Artikel im Warenkorb ist nicht mehr verfügbar. Aktualisieren Sie den Katalog.' };
  }

  const [{ data: salesSetting, error: salesSettingError }, { data: packages, error: packagesError }] = await Promise.all([
    supabase.from('wood_sales_settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('wood_sales_packages').select('*').order('sort_order'),
  ]);
  if (salesSettingError || packagesError) {
    return { success: false, message: 'Die Verkaufseinstellungen sind nicht verfügbar. Bitte kontaktieren Sie uns.' };
  }
  const salesSettings = normalizeWoodSalesSettings(salesSetting, packages);
  if (!salesSettings) return { success: false, message: 'Die Verkaufseinstellungen sind unvollständig. Kontaktieren Sie uns vor der Bestellung.' };

  const orderLines: OrderLine[] = [];
  const volumesByProduct = new Map<string, number>();
  const unitsByProduct = new Map<string, number>();
  let deliveryLitres = 0;
  let subtotalCents = 0;
  for (const requested of lines) {
    const product = products.find((item) => item.slug === requested.slug);
    if (!product || !product.in_stock) {
      return { success: false, message: `${product ? woodDisplayName(product.name) : 'Ein Artikel'} ist nicht mehr verfügbar.` };
    }
    if (!salesSettings.allowedLengthsCm.includes(requested.lengthCm)) {
      return { success: false, message: `Die Länge ${lengthLabel(requested.lengthCm)} wird nicht mehr angeboten. Aktualisieren Sie Ihren Warenkorb.` };
    }
    const packageDetails = salesSettings.packages.find((item) => item.package_code === requested.packageCode);
    if (!packageDetails || packageDetails.price == null) {
      return { success: false, message: `Der Preis für ${woodDisplayName(product.name)} (${packageDetails?.label ?? 'dieses Format'}) muss auf Anfrage bestätigt werden.` };
    }

    const lineVolumeLitres = (packageDetails.volume_litres ?? 0) * requested.quantity;
    volumesByProduct.set(product.id, (volumesByProduct.get(product.id) ?? 0) + lineVolumeLitres / 1000);
    deliveryLitres += lineVolumeLitres;
    unitsByProduct.set(product.id, (unitsByProduct.get(product.id) ?? 0) + requested.quantity);
    const unitPriceCents = toCents(Number(packageDetails.price));
    const lineTotalCents = unitPriceCents * requested.quantity;
    subtotalCents += lineTotalCents;
    orderLines.push({
      slug: product.slug,
      name: product.name,
      lengthCm: requested.lengthCm,
      packageCode: requested.packageCode,
      packageLabel: packageDetails.label,
      quantity: requested.quantity,
      unitPrice: euros(unitPriceCents),
      total: euros(lineTotalCents),
    });
  }

  for (const product of products) {
    const requestedUnits = unitsByProduct.get(product.id) ?? 0;
    if (requestedUnits > salesSettings.maxQuantityPerProduct) {
      return { success: false, message: `Die Höchstmenge für ${woodDisplayName(product.name)} beträgt ${salesSettings.maxQuantityPerProduct} Einheiten pro Bestellung.` };
    }
    const requestedVolume = volumesByProduct.get(product.id) ?? 0;
    if (product.stock_m3 != null && requestedVolume > product.stock_m3 + 1e-9) {
      return { success: false, message: `Der Lagerbestand für ${woodDisplayName(product.name)} ist auf ${product.stock_m3} m³ begrenzt.` };
    }
  }
  const deliveryCents = Math.round(subtotalCents * 0.30);
  return {
    success: true,
    lines: orderLines,
    subtotalCents,
    deliveryCents,
    deliveryLitres,
    deliveryPricePerLitre: 0,
  };
}

export async function getWoodCartQuote(value: unknown) {
  const parsed = woodOrderLinesSchema.safeParse(value);
  if (!parsed.success) return { success: false as const, message: parsed.error.issues[0]?.message ?? 'Bitte prüfen Sie die Artikel im Warenkorb.' };
  const priced = await priceWoodCart(parsed.data);
  if (!priced.success) return priced;
  const totalCents = priced.subtotalCents + priced.deliveryCents;
  return {
    success: true as const,
    lines: priced.lines,
    subtotal: euros(priced.subtotalCents),
    deliveryFee: euros(priced.deliveryCents),
    deliveryLitres: priced.deliveryLitres,
    deliveryPricePerLitre: priced.deliveryPricePerLitre,
    total: euros(totalCents),
    deposit: euros(Math.round(totalCents / 2)),
  };
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

export async function submitWoodOrder(value: unknown, expectedTotal: number): Promise<SubmitOrderResult> {
  const parsed = woodOrderSchema.safeParse(value);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Bitte überprüfen Sie Ihre Bestelldaten.');
  if (parsed.data.website) return fail('Die Bestellung konnte nicht übermittelt werden.');

  let settingsClient: ReturnType<typeof createAdminClient>;
  try { settingsClient = createAdminClient(); }
  catch { return fail('Die Supabase-Administratorkonfiguration ist unvollständig.'); }
  const { data: paymentSettings, error: settingsError } = await settingsClient
    .from('wood_store_settings').select('payment_method,payment_url,bank_name,bank_account_holder,bank_iban,bank_bic').eq('id', 1).maybeSingle();
  if (settingsError) return fail('Die Zahlungseinstellungen sind nicht verfügbar. Wenden Sie die Supabase-Migration für die Shop-Einstellungen an.');
  const payment = getPaymentDetails(paymentSettings);
  if (!payment) return fail('Die ausgewählte Zahlungsart ist unvollständig. Richten Sie sie unter Verwaltung > Zahlung & Bankverbindung ein.');

  const emailRecipient = process.env.WOOD_ORDER_EMAIL?.trim() || process.env.ALERT_EMAIL?.trim();
  const priced = await priceWoodCart(parsed.data.lines);
  if (!priced.success) return fail(priced.message);
  const subtotalCents = priced.subtotalCents;
  const orderLines = priced.lines;
  const totalCents = subtotalCents + priced.deliveryCents;
  if (!Number.isFinite(expectedTotal) || toCents(expectedTotal) !== totalCents) {
    return fail('Der Preis oder die Lieferkosten haben sich seit der Warenkorbberechnung geändert. Aktualisieren Sie die Seite und prüfen Sie den neuen Gesamtbetrag vor der Bestellung.');
  }
  // L’acompte représente exactement 50 % du montant total, livraison comprise.
  const depositCents = Math.round(totalCents / 2);
  const customer = parsed.data.customer;
  const reference = `HN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID().slice(0, 6).toUpperCase()}`;
  const order: OrderConfirmation = {
    reference,
    customer,
    lines: orderLines,
    subtotal: euros(subtotalCents),
    deliveryFee: euros(priced.deliveryCents),
    deliveryLitres: priced.deliveryLitres,
    deliveryPricePerLitre: priced.deliveryPricePerLitre,
    total: euros(totalCents),
    deposit: euros(depositCents),
    remaining: euros(totalCents - depositCents),
    payment,
  };

  const { error: orderSaveError } = await settingsClient.from('wood_orders').insert({
    reference,
    customer_first_name: customer.firstName,
    customer_last_name: customer.lastName,
    customer_address: customer.address,
    customer_postal_code: customer.postalCode,
    customer_city: customer.city,
    customer_phone: customer.phone,
    customer_email: customer.email,
    lines: orderLines,
    subtotal: order.subtotal,
    delivery_fee: order.deliveryFee,
    delivery_litres: order.deliveryLitres,
    delivery_price_per_litre: order.deliveryPricePerLitre,
    total: order.total,
    deposit: order.deposit,
    remaining: order.remaining,
    payment_method: payment.method,
  });
  if (orderSaveError) {
    return fail('Die Bestellung konnte nicht gespeichert werden. Bitte kontaktieren Sie uns oder versuchen Sie es später erneut.');
  }

  const itemsSummary = orderLines.map((line) => {
    const packageLabel = line.packageLabel ?? (line.packageCode ? getWoodPackage(line.packageCode)?.label : undefined);
    const format = packageLabel ? `${line.quantity} × ${packageLabel}` : `${line.quantity} Einheiten`;
    return `${format} — ${woodDisplayName(line.name)}, ${lengthLabel(line.lengthCm)} — ${formatPrice(toCents(line.unitPrice))} — Gesamt ${formatPrice(toCents(line.total))}`;
  }).join('\n');
  const sent = await sendAdminAlert(`Neue HolzNest-Bestellung ${reference}`, {
    Referenz: reference,
    Kunde: `${customer.firstName} ${customer.lastName}`,
    Anschrift: `${customer.address}, ${customer.postalCode} ${customer.city}`,
    Telefon: customer.phone,
    'E-Mail': customer.email,
    Artikel: itemsSummary,
    'Zwischensumme Holz': formatPrice(subtotalCents),
    'Lieferung (30 % des Warenwerts)': formatPrice(priced.deliveryCents),
    'Gesamtbetrag': formatPrice(totalCents),
    'Anzahlung (50 % des Gesamtbetrags)': formatPrice(depositCents),
    'Restbetrag': formatPrice(totalCents - depositCents),
    Zahlung: payment.method === 'link'
      ? payment.link.url
      : `RIB · ${payment.rib.accountHolder} · ${payment.rib.iban}`,
  }, emailRecipient);

  order.adminNotified = sent;
  return { success: true, message: 'Die Bestellübersicht und Zahlungsinformationen stehen bereit.', order };
}
