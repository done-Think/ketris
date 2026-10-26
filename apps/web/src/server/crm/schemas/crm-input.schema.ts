import { z } from 'zod'
import { CRM_LIMITS } from '../constants/validation'

export const crmNameSchema = z.string().trim().min(1, 'Nome é obrigatório.').max(CRM_LIMITS.name)
export const crmEmailSchema = z
  .string()
  .trim()
  .max(CRM_LIMITS.email)
  .email('E-mail inválido.')
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
    'Use no máximo duas casas decimais.',
  )
