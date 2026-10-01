import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string({ required_error: 'Bitte geben Sie Ihren Namen ein.', invalid_type_error: 'Bitte geben Sie Ihren Namen ein.' }).trim().min(2, 'Bitte geben Sie Ihren Namen ein.'),
  email: z.string({ required_error: 'Bitte geben Sie Ihre E-Mail-Adresse ein.', invalid_type_error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' }).trim().email('Bitte geben Sie eine gültige E-Mail-Adresse ein.'),
  phone: z.string({ invalid_type_error: 'Bitte geben Sie eine gültige Telefonnummer ein.' }).trim().max(20, 'Die Telefonnummer darf höchstens 20 Zeichen enthalten.').optional().or(z.literal('')),
  subject: z.string({ required_error: 'Bitte geben Sie einen Betreff ein.', invalid_type_error: 'Bitte geben Sie einen Betreff ein.' }).trim().min(3, 'Bitte geben Sie einen Betreff ein.'),
  message: z.string({ required_error: 'Bitte geben Sie eine Nachricht ein.', invalid_type_error: 'Bitte geben Sie eine Nachricht ein.' }).trim().min(10, 'Ihre Nachricht muss mindestens 10 Zeichen enthalten.').max(3000, 'Ihre Nachricht darf höchstens 3.000 Zeichen enthalten.'),
  website: z.string({ invalid_type_error: 'Dieses Feld muss leer bleiben.' }).max(0, 'Dieses Feld muss leer bleiben.').optional().or(z.literal('')),
});

export type ContactInput = z.infer<typeof contactSchema>;
