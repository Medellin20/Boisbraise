import { z } from 'zod';

export const woodOrderSchema = z.object({
  customer: z.object({
    firstName: z.string({ required_error: 'Bitte geben Sie Ihren Vornamen ein.', invalid_type_error: 'Bitte geben Sie Ihren Vornamen ein.' }).trim().min(2, 'Bitte geben Sie Ihren Vornamen ein.').max(80, 'Der Vorname darf höchstens 80 Zeichen enthalten.'),
    lastName: z.string({ required_error: 'Bitte geben Sie Ihren Nachnamen ein.', invalid_type_error: 'Bitte geben Sie Ihren Nachnamen ein.' }).trim().min(2, 'Bitte geben Sie Ihren Nachnamen ein.').max(80, 'Der Nachname darf höchstens 80 Zeichen enthalten.'),
    address: z.string({ required_error: 'Bitte geben Sie eine vollständige Lieferadresse ein.', invalid_type_error: 'Bitte geben Sie eine vollständige Lieferadresse ein.' }).trim().min(5, 'Bitte geben Sie eine vollständige Lieferadresse ein.').max(240, 'Die Lieferadresse darf höchstens 240 Zeichen enthalten.'),
    postalCode: z.string({ required_error: 'Bitte geben Sie die Postleitzahl ein.', invalid_type_error: 'Bitte geben Sie die Postleitzahl ein.' }).trim().min(3, 'Bitte geben Sie die Postleitzahl ein.').max(16, 'Die Postleitzahl darf höchstens 16 Zeichen enthalten.'),
    city: z.string({ required_error: 'Bitte geben Sie den Ort ein.', invalid_type_error: 'Bitte geben Sie den Ort ein.' }).trim().min(2, 'Bitte geben Sie den Ort ein.').max(100, 'Der Ort darf höchstens 100 Zeichen enthalten.'),
    phone: z.string({ required_error: 'Bitte geben Sie eine Telefonnummer ein.', invalid_type_error: 'Bitte geben Sie eine Telefonnummer ein.' }).trim().min(6, 'Bitte geben Sie eine Telefonnummer ein.').max(32, 'Die Telefonnummer darf höchstens 32 Zeichen enthalten.'),
    email: z.string({ required_error: 'Bitte geben Sie Ihre E-Mail-Adresse ein.', invalid_type_error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' }).trim().email('Bitte geben Sie eine gültige E-Mail-Adresse ein.').max(254, 'Die E-Mail-Adresse darf höchstens 254 Zeichen enthalten.'),
  }, { required_error: 'Bitte geben Sie Ihre Kontaktdaten ein.', invalid_type_error: 'Bitte überprüfen Sie Ihre Kontaktdaten.' }),
  lines: z.array(z.object({
    slug: z.string({ required_error: 'Das Produkt im Warenkorb ist ungültig.', invalid_type_error: 'Das Produkt im Warenkorb ist ungültig.' }).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Das Produkt im Warenkorb ist ungültig.'),
    lengthCm: z.union([z.literal(25), z.literal(33), z.literal(40), z.literal(50), z.literal(100)], {
      errorMap: () => ({ message: 'Bitte wählen Sie eine gültige Scheitlänge aus.' }),
    }),
    quantity: z.number({ invalid_type_error: 'Bitte geben Sie eine gültige Menge ein.' }).int('Die Menge muss eine ganze Zahl sein.').min(1, 'Die Menge muss mindestens 1 m³ betragen.').max(100, 'Die Menge darf höchstens 100 m³ betragen.'),
  }, { required_error: 'Die Bestellposition ist ungültig.', invalid_type_error: 'Die Bestellposition ist ungültig.' }), { required_error: 'Bitte wählen Sie mindestens ein Produkt aus.', invalid_type_error: 'Bitte überprüfen Sie die Produkte im Warenkorb.' }).min(1, 'Bitte wählen Sie mindestens ein Produkt aus.').max(20, 'Sie können höchstens 20 Produkte gleichzeitig bestellen.'),
  website: z.string({ invalid_type_error: 'Dieses Feld muss leer bleiben.' }).max(0, 'Dieses Feld muss leer bleiben.').optional().or(z.literal('')),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Bitte stimmen Sie den Bedingungen zu, damit Ihre Bestellung bearbeitet werden kann.' }) }),
});

export type WoodOrderInput = z.infer<typeof woodOrderSchema>;
