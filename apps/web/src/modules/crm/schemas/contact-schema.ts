import { z } from 'zod'

export const contactTypeSchema = z.enum(['PROPRIETARIO', 'LOCATARIO', 'CORRETOR'])

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome e obrigatorio.'),
  email: z.string().trim().email('E-mail invalido.'),
  phone: z.string().trim(),
  type: contactTypeSchema,
  notes: z.string().trim(),
})

export type ContactFormValues = z.infer<typeof contactFormSchema>
