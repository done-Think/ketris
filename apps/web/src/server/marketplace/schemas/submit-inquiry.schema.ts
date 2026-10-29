import '@server/openapi/zod-extend'
import { z } from 'zod'

export const submitInquiryRequestSchema = z
  .object({
    website: z.string().max(200).optional(),
    leadName: z.string().trim().min(1).max(120).openapi({ example: 'Maria Silva' }),
    leadEmail: z.string().trim().max(254).email().openapi({ example: 'maria@exemplo.com' }),
    leadPhone: z.string().trim().min(1).max(30).optional().openapi({ example: '(41) 99999-9999' }),
    proposedValue: z.number().positive().max(9999999999.99).optional(),
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
      status: z.literal('SENT'),
      createdAt: z.string(),
    }),
  })
  .openapi('SubmitInquiryResponse')
