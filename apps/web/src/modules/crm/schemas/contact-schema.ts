import { z } from 'zod'

export type SchemaMessageTranslator = (key: string) => string

export const contactTypeSchema = z.enum(['PROPRIETARIO', 'LOCATARIO', 'CORRETOR'])

export function createContactFormSchema(t: SchemaMessageTranslator) {
  return z.object({
    name: z.string().trim().min(1, t('nameRequired')),
    email: z.string().trim().email(t('emailInvalid')),
    phone: z.string().trim(),
    type: contactTypeSchema,
    notes: z.string().trim(),
  })
}

export type ContactFormValues = z.infer<ReturnType<typeof createContactFormSchema>>
