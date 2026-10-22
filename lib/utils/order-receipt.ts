import type { OrderConfirmation } from '@/lib/types/order';
import { lengthLabel } from '@/lib/utils/wood';
import { woodDisplayName } from '@/lib/utils/wood-display';
import { getWoodPackage } from '@/lib/utils/wood-packages';

type Color = readonly [number, number, number];

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const LEFT = 13;
const RIGHT = 197;
const CONTENT_WIDTH = RIGHT - LEFT;
const COLORS = {
  brown: [91, 48, 14] as const,
  dark: [35, 35, 35] as const,
  muted: [99, 94, 86] as const,
  green: [42, 104, 49] as const,
  paleGreen: [240, 247, 237] as const,
  paleBrown: [250, 242, 230] as const,
  border: [222, 218, 210] as const,
  red: [177, 35, 25] as const,
  paleRed: [255, 241, 237] as const,
  white: [255, 255, 255] as const,
};

/** This confirms the order details, not receipt of funds. */
export async function downloadOrderReceipt(order: OrderConfirmation) {
  const { jsPDF } = await import('jspdf');
  const logoResponse = await fetch('/images/holznest-logo-transparent.png');
  if (!logoResponse.ok) throw new Error('Le logo du reçu n’a pas pu être chargé.');
  const logo = new Uint8Array(await logoResponse.arrayBuffer());
  const doc = new jsPDF();
  const money = (value: number) => new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 2,
  }).format(value);
  const date = new Date().toLocaleDateString('de-DE');
  let y = 14;

  function text(value: string, x: number, atY: number, options?: { align?: 'left' | 'center' | 'right'; maxWidth?: number }) {
    doc.text(value, x, atY, options);
  }

  function line(x1: number, y1: number, x2: number, y2: number, color: Color = COLORS.border) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.25);
    doc.line(x1, y1, x2, y2);
  }

  function sectionBar(title: string, atY: number) {
    doc.setFillColor(...COLORS.brown);
    doc.roundedRect(LEFT, atY, CONTENT_WIDTH, 11, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.white);
    text(title, LEFT + 5, atY + 7.2);
  }

  function continuePage() {
    doc.addPage();
    y = 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.brown);
    text('HOLZNEST  ·  BESTELLBELEG', LEFT, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    text(order.reference, RIGHT, y, { align: 'right' });
    line(LEFT, y + 4, RIGHT, y + 4, COLORS.brown);
    y += 13;
  }

  function ensureSpace(height: number) {
    if (y + height > 270) continuePage();
  }

  function drawInfoCard(x: number, atY: number, width: number, height: number, title: string) {
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(x, atY, width, height, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.brown);
    text(title, x + 5, atY + 8);
  }

  function drawTableHeading() {
    doc.setFillColor(...COLORS.paleBrown);
    doc.rect(LEFT, y, CONTENT_WIDTH, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.dark);
    text('Artikel', LEFT + 4, y + 6);
    text('Menge', 91, y + 6, { align: 'center' });
    text('Einheit', 122, y + 6, { align: 'center' });
    text('Einzelpreis', 161, y + 6, { align: 'right' });
    text('Gesamt', RIGHT - 4, y + 6, { align: 'right' });
    y += 9;
  }

  doc.setFillColor(...COLORS.brown);
  doc.rect(0, 0, PAGE_WIDTH, 3, 'F');
  doc.addImage(logo, 'PNG', LEFT + 1, 5, 28, 21);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...COLORS.dark);
  text('HOLZ NEST', LEFT + 31, 20);
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.brown);
  text('BRENNHOLZ & LIEFERUNG', LEFT + 31, 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.setTextColor(...COLORS.brown);
  text('BESTELLBELEG', RIGHT, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  text(`Bestellnummer:  ${order.reference}`, RIGHT, 22, { align: 'right' });
  text(`Bestelldatum:  ${date}`, RIGHT, 28, { align: 'right' });
  line(LEFT, 34, RIGHT, 34, COLORS.brown);

  doc.setFillColor(...COLORS.paleRed);
  doc.roundedRect(LEFT, 38, CONTENT_WIDTH, 18, 2.5, 2.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.red);
  text('ZAHLUNG AUSSTEHEND', LEFT + 5, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.dark);
  text(order.adminNotified === false
    ? 'Bestellung vorbereitet, aber noch nicht an unser Team übermittelt. Bitte kontaktieren Sie HolzNest vor der Zahlung.'
    : 'Zahlungseingang noch nicht bestätigt. Dieser Bestellbeleg ist keine Zahlungsquittung.',
  LEFT + 5, 51, { maxWidth: CONTENT_WIDTH - 10 });

  const cardY = 61;
  const cardHeight = 43;
  const cardGap = 4;
  const cardWidth = (CONTENT_WIDTH - cardGap) / 2;
  drawInfoCard(LEFT, cardY, cardWidth, cardHeight, 'KUNDE');
  drawInfoCard(LEFT + cardWidth + cardGap, cardY, cardWidth, cardHeight, 'BESTELLUNG');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  text(`${order.customer.firstName} ${order.customer.lastName}`, LEFT + 5, cardY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  text(`${order.customer.address}, ${order.customer.postalCode} ${order.customer.city}`, LEFT + 5, cardY + 22, { maxWidth: cardWidth - 10 });
  text(order.customer.phone, LEFT + 5, cardY + 29);
  text(order.customer.email, LEFT + 5, cardY + 36, { maxWidth: cardWidth - 10 });

  const infoX = LEFT + cardWidth + cardGap + 5;
  doc.setFontSize(8);
  text(`Bestellnummer:  ${order.reference}`, infoX, cardY + 15, { maxWidth: cardWidth - 10 });
  text(`Bestelldatum:  ${date}`, infoX, cardY + 22);
  text(`Zahlungsart:  ${order.payment.method === 'rib' ? 'Banküberweisung' : 'Online-Zahlungslink'}`, infoX, cardY + 29);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.red);
  text('Zahlungsstatus:  Zahlung ausstehend', infoX, cardY + 36, { maxWidth: cardWidth - 10 });

  y = cardY + cardHeight + 5;
  sectionBar('IHRE BESTELLUNG', y);
  y += 11;
  drawTableHeading();

  for (const orderLine of order.lines) {
    const item = `${woodDisplayName(orderLine.name)} · ${lengthLabel(orderLine.lengthCm)}`;
    const unit = orderLine.packageLabel ?? (orderLine.packageCode ? getWoodPackage(orderLine.packageCode)?.label : undefined) ?? 'Einheit';
    const itemLines: string[] = doc.splitTextToSize(item, 66);
    const unitLines: string[] = doc.splitTextToSize(unit, 28);
    const rowHeight = Math.max(11, Math.max(itemLines.length, unitLines.length) * 4 + 4);
    if (y + rowHeight > 270) {
      continuePage();
      sectionBar('IHRE BESTELLUNG · FORTSETZUNG', y);
      y += 11;
      drawTableHeading();
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.dark);
    doc.text(itemLines, LEFT + 4, y + 6);
    text(String(orderLine.quantity), 91, y + 6, { align: 'center' });
    doc.text(unitLines, 122, y + 6, { align: 'center' });
    text(money(orderLine.unitPrice), 161, y + 6, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    text(money(orderLine.total), RIGHT - 4, y + 6, { align: 'right' });
    y += rowHeight;
    line(LEFT, y, RIGHT, y);
  }

  const summaryWidth = 77;
  const summaryX = RIGHT - summaryWidth;
  ensureSpace(32);
  y += 2;
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(summaryX, y, summaryWidth, 29, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.dark);
  text('Holzwarenwert', summaryX + 4, y + 7);
  text(money(order.subtotal), RIGHT - 4, y + 7, { align: 'right' });
  text(`Lieferung (${order.deliveryLitres.toLocaleString('de-DE')} l)`, summaryX + 4, y + 14);
  text(money(order.deliveryFee), RIGHT - 4, y + 14, { align: 'right' });
  line(summaryX, y + 18, RIGHT, y + 18);
  doc.setFillColor(...COLORS.paleBrown);
  doc.roundedRect(summaryX, y + 19, summaryWidth, 10, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.brown);
  text('Gesamtbetrag', summaryX + 4, y + 26);
  text(money(order.total), RIGHT - 4, y + 26, { align: 'right' });
  y += 34;

  ensureSpace(39);
  doc.setFillColor(...COLORS.paleGreen);
  doc.setDrawColor(148, 187, 137);
  doc.roundedRect(LEFT, y, CONTENT_WIDTH, 34, 2.5, 2.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.green);
  text('ZAHLUNGSÜBERSICHT', LEFT + 5, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  text('Gesamtbetrag', LEFT + 6, y + 16);
  text(money(order.total), LEFT + 105, y + 16, { align: 'right' });
  text('Anzahlung zur Bestätigung (50 %)', LEFT + 6, y + 23);
  doc.setFont('helvetica', 'bold');
  text(money(order.deposit), LEFT + 105, y + 23, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  text('Restbetrag bei Lieferung', LEFT + 6, y + 30);
  text(money(order.remaining), LEFT + 105, y + 30, { align: 'right' });
  line(LEFT + 112, y + 5, LEFT + 112, y + 29, [174, 196, 164]);
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.green);
  const paymentNote = doc.splitTextToSize(
    '50 % des Gesamtbetrags einschließlich Lieferung zur Bestätigung. Die restlichen 50 % sind bei Lieferung fällig.',
    CONTENT_WIDTH - 123
  );
  doc.text(paymentNote, LEFT + 118, y + 13);
  y += 40;

  if (order.payment.method === 'rib' && order.payment.rib) {
    const bank = order.payment.rib;
    const bankLines = [
      `Bankverbindung${bank.bankName ? ` · ${bank.bankName}` : ''}`,
      `Kontoinhaber: ${bank.accountHolder}`,
      `IBAN: ${bank.iban}`,
      ...(bank.bic ? [`BIC: ${bank.bic}`] : []),
    ];
    const bankHeight = bankLines.length * 4.5 + 6;
    ensureSpace(bankHeight + 3);
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(LEFT, y, CONTENT_WIDTH, bankHeight, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.dark);
    bankLines.forEach((value, index) => text(value, LEFT + 5, y + 6 + index * 4.5));
    y += bankHeight + 3;
  } else if (order.payment.method === 'link' && order.payment.link) {
    const linkLines: string[] = doc.splitTextToSize(`Zahlungslink: ${order.payment.link.url}`, CONTENT_WIDTH - 10);
    const linkHeight = linkLines.length * 4.5 + 6;
    ensureSpace(linkHeight + 3);
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(LEFT, y, CONTENT_WIDTH, linkHeight, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.dark);
    doc.text(linkLines, LEFT + 5, y + 6);
    y += linkHeight + 3;
  }

  ensureSpace(16);
  doc.setFillColor(...COLORS.paleRed);
  doc.roundedRect(LEFT, y, CONTENT_WIDTH, 13, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.red);
  text('Zahlungsstatus: Zahlungseingang noch nicht bestätigt.', LEFT + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  text(order.adminNotified === false
    ? 'Die Bestellung wurde noch nicht an unser Team übermittelt. Bitte kontaktieren Sie HolzNest vor der Zahlung.'
    : 'Dieser Bestellbeleg ist keine Zahlungsquittung.',
  LEFT + 4, y + 10);

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    line(LEFT, PAGE_HEIGHT - 13, RIGHT, PAGE_HEIGHT - 13, COLORS.brown);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.brown);
    text('HOLZNEST  ·  BRENNHOLZ & LIEFERUNG', LEFT, PAGE_HEIGHT - 8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    text(`Erstellt am ${date}  ·  Seite ${page}/${pageCount}`, RIGHT, PAGE_HEIGHT - 8, { align: 'right' });
  }

  doc.save(`HolzNest-Bestellbeleg-${order.reference.replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf`);
}
