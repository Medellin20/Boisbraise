import { z } from 'zod';

export const adminLoginSchema = z.object({
  password: z.string({ required_error: 'Bitte geben Sie das Passwort ein.', invalid_type_error: 'Bitte geben Sie das Passwort ein.' }).min(1, 'Bitte geben Sie das Passwort ein.'),
});
