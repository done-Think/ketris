import { z } from 'zod'

export type SchemaMessageTranslator = (key: string) => string

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

export function createUpdateOpportunitySchema(t: SchemaMessageTranslator) {
  return z
    .object({
      leadName: z.string().trim().min(1, t('nameRequired')).optional(),
      leadEmail: z.string().trim().email(t('emailInvalid')).optional(),
      leadPhone: z.string().trim().min(1, t('phoneInvalid')).nullable().optional(),
      proposedValue: z.number().positive(t('proposedValuePositive')).optional(),
      contractTermMonths: z.number().int().positive(t('contractTermInvalid')).nullable().optional(),
      desiredStartDate: z
        .string()
        .trim()
        .min(1, t('desiredStartDateInvalid'))
        .nullable()
        .optional(),
      guaranteeType: contractGuaranteeSchema.optional(),
      specialConditions: z.array(z.string().trim().min(1, t('specialConditionInvalid'))).optional(),
      notes: z.string().trim().min(1, t('notesInvalid')).nullable().optional(),
      status: opportunityStatusSchema.optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
      message: t('atLeastOneFieldRequired'),
    })
}

export function createOpportunityFormSchema(t: SchemaMessageTranslator) {
  return z.object({
    propertyId: z.string().trim().min(1, t('propertyRequired')),
    leadName: z.string().trim().min(1, t('nameRequired')),
    leadEmail: z.string().trim().email(t('emailInvalid')),
    leadPhone: z.string().trim(),
    proposedValue: z
      .string()
      .trim()
      .min(1, t('proposedValueRequired'))
      .refine((value) => {
        const amount = Number(value)
        return Number.isFinite(amount) && amount > 0
      }, t('proposedValuePositive')),
    notes: z.string().trim(),
    status: z.enum(['RASCUNHO', 'ENVIADA']),
  })
}

export function createEditOpportunityFormSchema(t: SchemaMessageTranslator) {
  return z.object({
    leadName: z.string().trim().min(1, t('nameRequired')),
    leadEmail: z.string().trim().email(t('emailInvalid')),
    leadPhone: z.string().trim(),
    proposedValue: z
      .string()
      .trim()
      .min(1, t('proposedValueRequired'))
      .refine((value) => {
        const amount = Number(value)
        return Number.isFinite(amount) && amount > 0
      }, t('proposedValuePositive')),
    contractTermMonths: z
      .string()
      .trim()
      .refine((value) => {
        if (!value) return true

        const months = Number(value)
        return Number.isInteger(months) && months > 0
      }, t('contractTermInvalid')),
    desiredStartDate: z.string().trim(),
    guaranteeType: contractGuaranteeSchema,
    specialConditions: z.string().trim(),
    notes: z.string().trim(),
  })
}
