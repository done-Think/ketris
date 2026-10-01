import { z } from 'zod'

export type SchemaMessageTranslator = (key: string) => string

const createRequiredTextSchema = (
  t: SchemaMessageTranslator,
  requiredKey: string,
  requirePublishFields: boolean,
) => (requirePublishFields ? z.string().min(1, t(requiredKey)) : z.string())

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/

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

export function createPublicProfileEditorSchema(
  t: SchemaMessageTranslator,
  options?: { requirePublishFields?: boolean },
) {
  const requirePublishFields = options?.requirePublishFields ?? false

  return z.object({
    displayName: z.string().min(2, t('displayNameRequired')),
    headline: createRequiredTextSchema(t, 'headlineRequired', requirePublishFields),
    bio: createRequiredTextSchema(t, 'bioRequired', requirePublishFields),
    creci: createRequiredTextSchema(t, 'creciRequired', requirePublishFields),
    phone: createRequiredTextSchema(t, 'phoneRequired', requirePublishFields),
    region: createRequiredTextSchema(t, 'regionRequired', requirePublishFields),
    neighborhoods: createRequiredTextSchema(t, 'neighborhoodsRequired', requirePublishFields),
    specialties: createRequiredTextSchema(t, 'specialtiesRequired', requirePublishFields),
    availability: createRequiredTextSchema(t, 'availabilityRequired', requirePublishFields),
    primaryColor: createHexColorSchema(t, 'primaryColorRequired', requirePublishFields),
    secondaryColor: createHexColorSchema(t, 'secondaryColorRequired', requirePublishFields),
    backgroundColor: createHexColorSchema(t, 'backgroundColorRequired', requirePublishFields),
    avatarUrl: createUrlSchema(t, 'avatarUrlRequired', requirePublishFields),
    bannerUrl: createUrlSchema(t, 'bannerUrlRequired', requirePublishFields),
  })
}

export type PublicProfileEditorFormValues = z.infer<
  ReturnType<typeof createPublicProfileEditorSchema>
>
