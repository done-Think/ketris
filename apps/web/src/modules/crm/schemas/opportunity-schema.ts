import { CRM_LIMITS } from '@server/crm/constants/validation'
import { z } from 'zod'
import { contactSelectionSchema } from './contact-selection-schema'

import type { SchemaMessageTranslator } from '@shared/types'
import { createPropertySelectionSchema } from './property-schema'

export const opportunityStatusSchema = z.enum([
  'DRAFT',
  'SENT',
  'IN_NEGOTIATION',
  'ACCEPTED',
  'REJECTED',
])

export const contractGuaranteeSchema = z.enum(['GUARANTOR', 'DEPOSIT', 'SURETY_BOND', 'NONE'])

export const opportunityFiltersSchema = z.object({
  status: opportunityStatusSchema.optional(),
  includeArchived: z.boolean().optional(),
})

export function createUpdateOpportunitySchema(
  t: SchemaMessageTranslator<
    | 'atLeastOneFieldRequired'
    | 'contractTermInvalid'
    | 'desiredStartDateInvalid'
    | 'emailInvalid'
    | 'nameRequired'
    | 'notesInvalid'
    | 'phoneInvalid'
    | 'proposedValuePositive'
    | 'specialConditionInvalid'
    | 'textTooLong'
  >,
) {
  return z
    .object({
      leadName: z
        .string()
        .trim()
        .min(1, t('nameRequired'))
        .max(CRM_LIMITS.name, t('textTooLong'))
        .optional(),
      leadEmail: z
        .string()
        .trim()
        .max(CRM_LIMITS.email, t('emailInvalid'))
        .email(t('emailInvalid'))
        .optional(),
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

export function createOpportunityTermsSchema(
  t: SchemaMessageTranslator<
    'contractTermInvalid' | 'desiredStartDateInvalid' | 'specialConditionInvalid'
  >,
) {
  return z.object({
    contact: contactSelectionSchema.nullable(),
    contractTermMonths: z
      .string()
      .trim()
      .refine((value) => {
        if (!value) return true

        const months = Number(value)
        return Number.isInteger(months) && months > 0 && months <= 2_147_483_647
      }, t('contractTermInvalid')),
    desiredStartDate: z
      .string()
      .trim()
      .refine(
        (value) => !value || z.string().date().safeParse(value).success,
        t('desiredStartDateInvalid'),
      ),
    guaranteeType: contractGuaranteeSchema,
    specialConditions: z.array(
      z.object({
        text: z
          .string()
          .trim()
          .min(1, t('specialConditionInvalid'))
          .max(CRM_LIMITS.shortText, t('specialConditionInvalid')),
      }),
    ),
  })
}

export function createOpportunityFormSchema(
  t: SchemaMessageTranslator<
    | 'contractTermInvalid'
    | 'desiredStartDateInvalid'
    | 'emailInvalid'
    | 'nameRequired'
    | 'phoneInvalid'
    | 'propertyRequired'
    | 'proposedValuePositive'
    | 'proposedValueRequired'
    | 'specialConditionInvalid'
    | 'textTooLong'
  >,
) {
  return z.object({
    property: createPropertySelectionSchema(t),
    leadName: z.string().trim().min(1, t('nameRequired')).max(CRM_LIMITS.name, t('textTooLong')),
    leadEmail: z.string().trim().max(CRM_LIMITS.email, t('emailInvalid')).email(t('emailInvalid')),
    leadPhone: z.string().trim().max(CRM_LIMITS.phone, t('phoneInvalid')),
    proposedValue: z
      .string()
      .trim()
      .min(1, t('proposedValueRequired'))
      .refine((value) => {
        const amount = Number(value)
        return (
          Number.isFinite(amount) &&
          amount >= 0.01 &&
          amount <= CRM_LIMITS.proposedValue &&
          Math.abs(amount * 100 - Math.round(amount * 100)) < 0.0001
        )
      }, t('proposedValuePositive')),
    notes: z.string().trim().max(CRM_LIMITS.notes, t('textTooLong')),
    status: z.enum(['DRAFT', 'SENT']),
    responsibleId: z.string(),
    ...createOpportunityTermsSchema(t).shape,
  })
}

export function createEditOpportunityFormSchema(
  t: SchemaMessageTranslator<
    | 'contractTermInvalid'
    | 'desiredStartDateInvalid'
    | 'emailInvalid'
    | 'nameRequired'
    | 'phoneInvalid'
    | 'proposedValuePositive'
    | 'proposedValueRequired'
    | 'specialConditionInvalid'
    | 'textTooLong'
  >,
) {
  return z.object({
    leadName: z.string().trim().min(1, t('nameRequired')).max(CRM_LIMITS.name, t('textTooLong')),
    leadEmail: z.string().trim().max(CRM_LIMITS.email, t('emailInvalid')).email(t('emailInvalid')),
    leadPhone: z.string().trim().max(CRM_LIMITS.phone, t('phoneInvalid')),
    proposedValue: z
      .string()
      .trim()
      .min(1, t('proposedValueRequired'))
      .refine((value) => {
        const amount = Number(value)
        return (
          Number.isFinite(amount) &&
          amount >= 0.01 &&
          amount <= CRM_LIMITS.proposedValue &&
          Math.abs(amount * 100 - Math.round(amount * 100)) < 0.0001
        )
      }, t('proposedValuePositive')),
    ...createOpportunityTermsSchema(t).shape,
    notes: z.string().trim().max(CRM_LIMITS.notes, t('textTooLong')),
  })
}
