import '@server/openapi/zod-extend'
import { z } from 'zod'

import { garantiaContratualSchema, inquirySchema, inquiryStatusSchema } from './inquiry.schema'

const interessadoNome = z.string().min(1, 'Nome é obrigatório.')
const interessadoEmail = z.string().email('E-mail inválido.')
const interessadoTelefone = z.string().min(1).nullable()
const valorProposto = z.number().positive('Valor proposto deve ser positivo.')
const prazoContratoMeses = z.number().int().positive().nullable()
const inicioPretendido = z.coerce.date().nullable()
const condicoesEspeciais = z.array(z.string().min(1))
const observacoes = z.string().min(1).nullable()

export const putInquiryRequestSchema = z
  .object({
    interessadoNome,
    interessadoEmail,
    interessadoTelefone: interessadoTelefone.optional(),
    valorProposto,
    prazoContratoMeses: prazoContratoMeses.optional(),
    inicioPretendido: inicioPretendido.optional(),
    garantiaContratual: garantiaContratualSchema.optional(),
    condicoesEspeciais: condicoesEspeciais.optional(),
    observacoes: observacoes.optional(),
    status: inquiryStatusSchema,
  })
  .openapi('PutInquiryRequest')

export type PutInquiryRequestDTO = z.infer<typeof putInquiryRequestSchema>

export const patchInquiryRequestSchema = z
  .object({
    interessadoNome: interessadoNome.optional(),
    interessadoEmail: interessadoEmail.optional(),
    interessadoTelefone: interessadoTelefone.optional(),
    valorProposto: valorProposto.optional(),
    prazoContratoMeses: prazoContratoMeses.optional(),
    inicioPretendido: inicioPretendido.optional(),
    garantiaContratual: garantiaContratualSchema.optional(),
    condicoesEspeciais: condicoesEspeciais.optional(),
    observacoes: observacoes.optional(),
    status: inquiryStatusSchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Informe ao menos um campo para atualizar.',
  })
  .openapi('PatchInquiryRequest')

export type PatchInquiryRequestDTO = z.infer<typeof patchInquiryRequestSchema>

export const updateInquiryResponseSchema = z
  .object({
    inquiry: inquirySchema,
  })
  .openapi('UpdateInquiryResponse')
