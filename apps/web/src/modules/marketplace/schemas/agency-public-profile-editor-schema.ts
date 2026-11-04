import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'
import type { TranslationKey } from '@/i18n/types/messages.types'

type ProfileValidationKey = TranslationKey<'marketplace.agencyProfileEditor.errors'>

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/
const INTERNAL_PROFILE_MEDIA_PATH = /^\/api\/(?:marketplace\/media\/|auth\/media\/avatars\/).+/

const createRequiredTextSchema = (
  t: SchemaMessageTranslator<ProfileValidationKey>,
  requiredKey: ProfileValidationKey,
  requirePublishFields: boolean,
) => (requirePublishFields ? z.string().min(1, t(requiredKey)) : z.string())

const createHexColorSchema = (
  t: SchemaMessageTranslator<ProfileValidationKey>,
  requiredKey: ProfileValidationKey,
  requirePublishFields: boolean,
) => {
  if (!requirePublishFields) {
    return z.string().regex(HEX_COLOR_PATTERN, t('hexColorInvalid')).or(z.literal(''))
  }

  return z.string().superRefine((value, ctx) => {
    if (!value.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: t(requiredKey) })
      return
    }

    if (!HEX_COLOR_PATTERN.test(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('hexColorInvalid') })
    }
  })
}

const createUrlSchema = (
  t: SchemaMessageTranslator<ProfileValidationKey>,
  requiredKey: ProfileValidationKey,
  requirePublishFields: boolean,
) => {
  const isValidMediaUrl = (value: string) =>
    z.string().url().safeParse(value).success || INTERNAL_PROFILE_MEDIA_PATH.test(value)

  if (!requirePublishFields) {
    return z.string().refine(isValidMediaUrl, t('urlInvalid')).or(z.literal(''))
  }

  return z.string().superRefine((value, ctx) => {
    if (!value.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: t(requiredKey) })
      return
    }

    if (!isValidMediaUrl(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('urlInvalid') })
    }
  })
}

export const agencyTeamMemberFieldSchema = z.object({
  userId: z.string(),
  name: z.string(),
})

function createAgencyPublicProfileEditorObjectSchema(
  t: SchemaMessageTranslator<ProfileValidationKey>,
  options?: { requirePublishFields?: boolean },
) {
  const requirePublishFields = options?.requirePublishFields ?? false

  return z.object({
    displayName: z.string().min(2, t('displayNameRequired')),
    headline: createRequiredTextSchema(t, 'headlineRequired', requirePublishFields),
    summary: createRequiredTextSchema(t, 'summaryRequired', requirePublishFields),
    legalCreci: createRequiredTextSchema(t, 'legalCreciRequired', requirePublishFields),
    headquarters: createRequiredTextSchema(t, 'headquartersRequired', requirePublishFields),
    address: createRequiredTextSchema(t, 'addressRequired', requirePublishFields),
    phone: z.string(),
    email: z.string().email(t('emailInvalid')).or(z.literal('')),
    coverage: createRequiredTextSchema(t, 'coverageRequired', requirePublishFields),
    segments: createRequiredTextSchema(t, 'segmentsRequired', requirePublishFields),
    yearsInMarket: createRequiredTextSchema(t, 'yearsInMarketRequired', requirePublishFields),
    primaryColor: z.string().regex(HEX_COLOR_PATTERN, t('hexColorInvalid')).or(z.literal('')),
    secondaryColor: z.string().regex(HEX_COLOR_PATTERN, t('hexColorInvalid')).or(z.literal('')),
    backgroundColor: createHexColorSchema(t, 'backgroundColorRequired', requirePublishFields),
    logoUrl: createUrlSchema(t, 'logoUrlRequired', requirePublishFields),
    bannerUrl: createUrlSchema(t, 'bannerUrlRequired', requirePublishFields),
    team: z.array(agencyTeamMemberFieldSchema).max(6, t('teamTooLarge')),
  })
}

export function createAgencyPublicProfileEditorSchema(
  t: SchemaMessageTranslator<ProfileValidationKey>,
  options?: { requirePublishFields?: boolean },
) {
  const schema = createAgencyPublicProfileEditorObjectSchema(t, options)

  if (!options?.requirePublishFields) return schema

  return schema.superRefine((values, ctx) => {
    if (!values.phone.trim() && !values.email.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('phoneOrEmailRequired'),
        path: ['phone'],
      })
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('phoneOrEmailRequired'),
        path: ['email'],
      })
    }
  })
}
