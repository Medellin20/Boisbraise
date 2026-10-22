import type { OrderConfirmation } from '@/lib/types/order';
import { orderLineDescription } from '@/lib/utils/order-line';

/** This confirms the order details, not receipt of funds. */
export async function downloadOrderReceipt(order: OrderConfirmation) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const money = (value: number) => new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR',
  }).format(value);
  let y = 22;
  function paragraph(text: string, bold = false, size = 11) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lines: string[] = doc.splitTextToSize(text, 170);
    for (const line of lines) {
      if (y > 275) { doc.addPage(); y = 22; }
      doc.text(line, 20, y);
      y += size * 0.45 + 2;
    }
    y += 3;
  }

  doc.setTextColor(23, 58, 39);
  paragraph('HolzNest', true, 24);
  paragraph('Bestellbeleg', true, 17);
  doc.setTextColor(55, 55, 55);
  paragraph(`Bestellnummer: ${order.reference}`, true);
  if (order.adminNotified === false) {
    paragraph('Bestellung vorbereitet, aber noch nicht an unser Team übermittelt. Bitte kontaktieren Sie HolzNest vor der Zahlung.');
  }
  paragraph(`Beleg erstellt am: ${new Date().toLocaleDateString('de-DE')}`);
  paragraph(`${order.customer.firstName} ${order.customer.lastName}`);
  paragraph(`Lieferadresse: ${order.customer.address}, ${order.customer.postalCode} ${order.customer.city}`);
  paragraph('Ihre Bestellung', true, 13);
  for (const line of order.lines) {
    paragraph(`${orderLineDescription(line)}: ${money(line.total)}`);
    paragraph(`Einzelpreis: ${money(line.unitPrice)}`, false, 10);
  }
  paragraph(`Holzwarenwert: ${money(order.subtotal)}`);
  paragraph(`Lieferung (${order.deliveryLitres.toLocaleString('de-DE')} l): ${money(order.deliveryFee)}`);
  paragraph(`Gesamtbetrag: ${money(order.total)}`, true);
  paragraph(`Anzahlung zur Bestätigung (50 %): ${money(order.deposit)}`, true);
  paragraph(`Restbetrag bei Lieferung: ${money(order.remaining)}`, true);
  paragraph('Zahlung in zwei Schritten: 50 % des Gesamtbetrags einschließlich Lieferung zur Bestätigung der Bestellung. Die restlichen 50 % sind bei Lieferung fällig.');
  paragraph('Zahlungsstatus: Zahlungseingang noch nicht bestätigt. Dieser Bestellbeleg ist keine Zahlungsquittung.');
  doc.save(`HolzNest-Bestellbeleg-${order.reference.replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf`);
}
