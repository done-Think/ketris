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
    leadName: z.string().trim().min(1, 'Nome e obrigatorio.').optional(),
    leadEmail: z.string().trim().email('E-mail invalido.').optional(),
    leadPhone: z.string().trim().min(1, 'Telefone invalido.').nullable().optional(),
    proposedValue: z.number().positive('Valor proposto deve ser positivo.').optional(),
    contractTermMonths: z.number().int().positive().nullable().optional(),
    desiredStartDate: z.string().trim().min(1).nullable().optional(),
    guaranteeType: contractGuaranteeSchema.optional(),
    specialConditions: z.array(z.string().trim().min(1)).optional(),
    notes: z.string().trim().min(1).nullable().optional(),
    status: opportunityStatusSchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Informe ao menos um campo para atualizar.',
  })

export const editOpportunityFormSchema = z.object({
  leadName: z.string().trim().min(1, 'Nome e obrigatorio.'),
  leadEmail: z.string().trim().email('E-mail invalido.'),
  leadPhone: z.string().trim(),
  proposedValue: z
    .string()
    .trim()
    .min(1, 'Valor proposto e obrigatorio.')
    .refine((value) => {
      const amount = Number(value)
      return Number.isFinite(amount) && amount > 0
    }, 'Valor proposto deve ser positivo.'),
  contractTermMonths: z
    .string()
    .trim()
    .refine((value) => {
      if (!value) return true

      const months = Number(value)
      return Number.isInteger(months) && months > 0
    }, 'Prazo deve ser um numero inteiro positivo.'),
  desiredStartDate: z.string().trim(),
  guaranteeType: contractGuaranteeSchema,
  specialConditions: z.string().trim(),
  notes: z.string().trim(),
})
