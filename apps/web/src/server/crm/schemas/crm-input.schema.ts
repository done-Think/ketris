import { validationRefinement } from '@server/shared/http/validation-messages'
import { z } from 'zod'
import { CRM_LIMITS } from '../constants/validation'

export const crmNameSchema = z.string().trim().min(1).max(CRM_LIMITS.name)
export const crmEmailSchema = z
  .string()
  .trim()
  .max(CRM_LIMITS.email)
  .email()
  .transform((value) => value.toLowerCase())
export const crmPhoneSchema = z.string().trim().min(1).max(CRM_LIMITS.phone)
export const crmShortTextSchema = z.string().trim().min(1).max(CRM_LIMITS.shortText)
export const crmNotesSchema = z.string().trim().min(1).max(CRM_LIMITS.notes)
export const crmProposedValueSchema = z
  .number()
  .min(0.01)
  .max(CRM_LIMITS.proposedValue)
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.0001,
    validationRefinement('decimalPlaces'),
  )
