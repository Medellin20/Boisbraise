import { z } from 'zod';

export const woodOrderSchema = z.object({
  customer: z.object({
    firstName: z.string().trim().min(2, 'Indiquez votre prénom.').max(80),
    lastName: z.string().trim().min(2, 'Indiquez votre nom.').max(80),
    address: z.string().trim().min(5, 'Indiquez une adresse de livraison complète.').max(240),
    postalCode: z.string().trim().min(3, 'Indiquez le code postal.').max(16),
    city: z.string().trim().min(2, 'Indiquez la ville.').max(100),
    phone: z.string().trim().min(6, 'Indiquez un numéro de téléphone.').max(32),
    email: z.string().trim().email('Adresse e-mail invalide.').max(254),
  }),
  lines: z.array(z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    lengthCm: z.union([z.literal(25), z.literal(33), z.literal(40), z.literal(50), z.literal(100)]),
    quantity: z.number().int().min(1).max(100),
  })).min(1).max(20),
  website: z.string().max(0).optional().or(z.literal('')),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Votre accord est nécessaire pour traiter la commande.' }) }),
});

export type WoodOrderInput = z.infer<typeof woodOrderSchema>;
