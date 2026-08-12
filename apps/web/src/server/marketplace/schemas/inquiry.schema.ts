import '@server/openapi/zod-extend'
import { z } from 'zod'

export const inquiryStatusSchema = z.enum([
  'RASCUNHO',
  'ENVIADA',
  'EM_NEGOCIACAO',
  'ACEITA',
  'RECUSADA',
])

export const garantiaContratualSchema = z.enum(['FIADOR', 'CAUCAO', 'SEGURO_FIANCA', 'NENHUMA'])

export const inquirySchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    imovelId: z.string(),
    interessadoNome: z.string(),
    interessadoEmail: z.string().email(),
    interessadoTelefone: z.string().nullable(),
    valorProposto: z.number(),
    prazoContratoMeses: z.number().int().nullable(),
    inicioPretendido: z.string().nullable(),
    garantiaContratual: garantiaContratualSchema,
    condicoesEspeciais: z.array(z.string()),
    observacoes: z.string().nullable(),
    status: inquiryStatusSchema,
    arquivadaEm: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi('Inquiry')
