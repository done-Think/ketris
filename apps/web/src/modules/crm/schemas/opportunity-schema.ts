import { z } from 'zod'

export const opportunityStatusSchema = z.enum([
  'RASCUNHO',
  'ENVIADA',
  'EM_NEGOCIACAO',
  'ACEITA',
  'RECUSADA',
])

export const contractGuaranteeSchema = z.enum(['FIADOR', 'CAUCAO', 'SEGURO_FIANCA', 'NENHUMA'])

export const opportunityFiltersSchema = z.object({
  status: opportunityStatusSchema.optional(),
  includeArchived: z.boolean().optional(),
})

export const updateOpportunitySchema = z
  .object({
    interessadoNome: z.string().trim().min(1, 'Nome e obrigatorio.').optional(),
    interessadoEmail: z.string().trim().email('E-mail invalido.').optional(),
    interessadoTelefone: z.string().trim().min(1, 'Telefone invalido.').nullable().optional(),
    valorProposto: z.number().positive('Valor proposto deve ser positivo.').optional(),
    prazoContratoMeses: z.number().int().positive().nullable().optional(),
    inicioPretendido: z.string().trim().min(1).nullable().optional(),
    garantiaContratual: contractGuaranteeSchema.optional(),
    condicoesEspeciais: z.array(z.string().trim().min(1)).optional(),
    observacoes: z.string().trim().min(1).nullable().optional(),
    status: opportunityStatusSchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Informe ao menos um campo para atualizar.',
  })
