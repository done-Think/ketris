import '@server/openapi/zod-extend'
import { z } from 'zod'

export const submitInquiryRequestSchema = z
  .object({
    interessadoNome: z.string().min(1, 'Nome é obrigatório.').openapi({ example: 'Maria Silva' }),
    interessadoEmail: z
      .string()
      .email('E-mail inválido.')
      .openapi({ example: 'maria@exemplo.com' }),
    interessadoTelefone: z.string().min(1).optional().openapi({ example: '(41) 99999-9999' }),
    valorProposto: z.number().positive('Valor proposto deve ser positivo.').optional(),
    observacoes: z
      .string()
      .min(1)
      .optional()
      .openapi({ example: 'Tenho interesse em agendar uma visita.' }),
  })
  .openapi('SubmitInquiryRequest')

export type SubmitInquiryRequestDTO = z.infer<typeof submitInquiryRequestSchema>

export const submitInquiryResponseSchema = z
  .object({
    inquiry: z.object({
      id: z.string(),
      imovelId: z.string(),
      status: z.literal('ENVIADA'),
      createdAt: z.string(),
    }),
  })
  .openapi('SubmitInquiryResponse')
