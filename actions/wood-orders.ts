'use server';

import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendAdminAlert } from '@/lib/notifications/email';
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
const formatPrice = (cents: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(euros(cents));

type PricedCartResult =
  | { success: false; message: string }
  | { success: true; lines: OrderLine[]; subtotalCents: number };

async function priceWoodCart(lines: WoodOrderInput['lines']): Promise<PricedCartResult> {
  const supabase = createClient();
  const slugs = [...new Set(lines.map((line) => line.slug))];
  const { data: products, error: productsError } = await supabase
    .from('wood_products')
    .select('id,slug,name,in_stock,stock_m3')
    .in('slug', slugs)
    .eq('is_published', true);
  if (productsError) return { success: false, message: 'Le catalogue est temporairement indisponible. Réessayez dans quelques instants.' };
  if (!products?.length || products.length !== slugs.length) {
    return { success: false, message: 'Un produit du panier n’est plus disponible. Actualisez le catalogue.' };
  }

  const [{ data: salesSetting, error: salesSettingError }, { data: packages, error: packagesError }] = await Promise.all([
    supabase.from('wood_sales_settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('wood_sales_packages').select('*').order('sort_order'),
  ]);
  if (salesSettingError || packagesError) {
    return { success: false, message: 'Les paramètres de vente sont indisponibles. Appliquez la migration des paramètres communs du bois.' };
  }
  const salesSettings = normalizeWoodSalesSettings(salesSetting, packages);
  if (!salesSettings) return { success: false, message: 'Les paramètres de vente sont incomplets. Contactez-nous avant de commander.' };

  const orderLines: OrderLine[] = [];
  const volumesByProduct = new Map<string, number>();
  const unitsByProduct = new Map<string, number>();
  let subtotalCents = 0;
  for (const requested of lines) {
    const product = products.find((item) => item.slug === requested.slug);
    if (!product || !product.in_stock) {
      return { success: false, message: `${product?.name ?? 'Un article'} n’est plus disponible.` };
    }
    if (!salesSettings.allowedLengthsCm.includes(requested.lengthCm)) {
      return { success: false, message: `La longueur ${lengthLabel(requested.lengthCm)} n’est plus proposée. Actualisez votre panier.` };
    }
    const packageDetails = salesSettings.packages.find((item) => item.package_code === requested.packageCode);
    if (!packageDetails || packageDetails.price == null) {
      return { success: false, message: `Le prix de ${product.name} (${packageDetails?.label ?? 'ce format'}) doit être confirmé par devis.` };
    }

    volumesByProduct.set(product.id, (volumesByProduct.get(product.id) ?? 0)
      + packageDetails.volume_litres / 1000 * requested.quantity);
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
      return { success: false, message: `La quantité maximale pour ${product.name} est de ${salesSettings.maxQuantityPerProduct} unité(s) par commande.` };
    }
    const requestedVolume = volumesByProduct.get(product.id) ?? 0;
    if (product.stock_m3 != null && requestedVolume > product.stock_m3 + 1e-9) {
      return { success: false, message: `Le stock de ${product.name} est limité à ${product.stock_m3} m³.` };
    }
  }
  return { success: true, lines: orderLines, subtotalCents };
}

export async function getWoodCartQuote(value: unknown) {
  const parsed = woodOrderLinesSchema.safeParse(value);
  if (!parsed.success) return { success: false as const, message: parsed.error.issues[0]?.message ?? 'Vérifiez les articles du panier.' };
  const deliveryFeeCents = getDeliveryFeeCents();
  if (deliveryFeeCents == null) {
    return { success: false as const, message: 'Les frais de livraison ne sont pas configurés.' };
  }
  const priced = await priceWoodCart(parsed.data);
  if (!priced.success) return priced;
  const totalCents = priced.subtotalCents + deliveryFeeCents;
  return {
    success: true as const,
    lines: priced.lines,
    subtotal: euros(priced.subtotalCents),
    deliveryFee: euros(deliveryFeeCents),
    total: euros(totalCents),
    deposit: euros(Math.round(totalCents / 2)),
  };
}

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

export async function submitWoodOrder(value: unknown, expectedTotal?: number): Promise<SubmitOrderResult> {
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

  const priced = await priceWoodCart(parsed.data.lines);
  if (!priced.success) return fail(priced.message);
  const subtotalCents = priced.subtotalCents;
  const orderLines = priced.lines;
  const totalCents = subtotalCents + deliveryFeeCents;
  if (expectedTotal != null && (!Number.isFinite(expectedTotal) || toCents(expectedTotal) !== totalCents)) {
    return fail('Le prix ou les frais de livraison ont changé depuis le calcul du panier. Actualisez la page pour vérifier le nouveau total avant de commander.');
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
    deliveryFee: euros(deliveryFeeCents),
    total: euros(totalCents),
    deposit: euros(depositCents),
    remaining: euros(totalCents - depositCents),
    payment,
  };

  const itemsSummary = orderLines.map((line) => {
    const packageLabel = line.packageLabel ?? (line.packageCode ? getWoodPackage(line.packageCode)?.label : undefined);
    const format = packageLabel ? `${line.quantity} × ${packageLabel}` : `${line.quantity} unités`;
    return `${format} — ${line.name}, ${lengthLabel(line.lengthCm)} — ${formatPrice(toCents(line.unitPrice))} — total ${formatPrice(toCents(line.total))}`;
  }).join('\n');
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
