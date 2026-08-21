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

export const editOpportunityFormSchema = z.object({
  interessadoNome: z.string().trim().min(1, 'Nome e obrigatorio.'),
  interessadoEmail: z.string().trim().email('E-mail invalido.'),
  interessadoTelefone: z.string().trim(),
  valorProposto: z
    .string()
    .trim()
    .min(1, 'Valor proposto e obrigatorio.')
    .refine((value) => {
      const amount = Number(value)
      return Number.isFinite(amount) && amount > 0
    }, 'Valor proposto deve ser positivo.'),
  prazoContratoMeses: z
    .string()
    .trim()
    .refine((value) => {
      if (!value) return true

      const months = Number(value)
      return Number.isInteger(months) && months > 0
    }, 'Prazo deve ser um numero inteiro positivo.'),
  inicioPretendido: z.string().trim(),
  garantiaContratual: contractGuaranteeSchema,
  condicoesEspeciais: z.string().trim(),
  observacoes: z.string().trim(),
})
