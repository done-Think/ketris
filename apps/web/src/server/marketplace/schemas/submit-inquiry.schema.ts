import '@server/openapi/zod-extend'
import { z } from 'zod'

export const submitInquiryRequestSchema = z
  .object({
    leadName: z
      .string()
      .trim()
      .min(1, 'Nome é obrigatório.')
      .max(120)
      .openapi({ example: 'Maria Silva' }),
    leadEmail: z
      .string()
      .trim()
      .max(254)
      .email('E-mail inválido.')
      .openapi({ example: 'maria@exemplo.com' }),
    leadPhone: z.string().trim().min(1).max(30).optional().openapi({ example: '(41) 99999-9999' }),
    proposedValue: z
      .number()
      .positive('Valor proposto deve ser positivo.')
      .max(9999999999.99)
      .optional(),
    notes: z
      .string()
      .trim()
      .min(1)
      .max(2000)
      .optional()
      .openapi({ example: 'Tenho interesse em agendar uma visita.' }),
  })
  .strict()
  .openapi('SubmitInquiryRequest')

export const submitInquiryResponseSchema = z
  .object({
    inquiry: z.object({
      id: z.string(),
      propertyId: z.string(),
      status: z.literal('ENVIADA'),
      createdAt: z.string(),
    }),
  })
  .openapi('SubmitInquiryResponse')
