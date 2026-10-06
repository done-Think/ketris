import { z } from 'zod'

export type SchemaMessageTranslator = (key: string) => string

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/

const createRequiredTextSchema = (
  t: SchemaMessageTranslator,
  requiredKey: string,
  requirePublishFields: boolean,
) => (requirePublishFields ? z.string().min(1, t(requiredKey)) : z.string())

const createHexColorSchema = (
  t: SchemaMessageTranslator,
  requiredKey: string,
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
  t: SchemaMessageTranslator,
  requiredKey: string,
  requirePublishFields: boolean,
) => {
  if (!requirePublishFields) {
    return z.string().url(t('urlInvalid')).or(z.literal(''))
  }

  return z.string().superRefine((value, ctx) => {
    if (!value.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: t(requiredKey) })
      return
    }

    if (!z.string().url().safeParse(value).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('urlInvalid') })
    }
  })
}

export const agencyTeamMemberFieldSchema = z.object({
  usuarioId: z.string(),
  name: z.string(),
})

function createAgencyPublicProfileEditorObjectSchema(
  t: SchemaMessageTranslator,
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
    backgroundColor: createHexColorSchema(t, 'backgroundColorRequired', requirePublishFields),
    logoUrl: createUrlSchema(t, 'logoUrlRequired', requirePublishFields),
    bannerUrl: createUrlSchema(t, 'bannerUrlRequired', requirePublishFields),
    team: requirePublishFields
      ? z.array(agencyTeamMemberFieldSchema).min(1, t('teamRequired')).max(6, t('teamTooLarge'))
      : z.array(agencyTeamMemberFieldSchema).max(6, t('teamTooLarge')),
  })
}

export function createAgencyPublicProfileEditorSchema(
  t: SchemaMessageTranslator,
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

export type AgencyPublicProfileEditorFormValues = z.infer<
  ReturnType<typeof createAgencyPublicProfileEditorObjectSchema>
>
