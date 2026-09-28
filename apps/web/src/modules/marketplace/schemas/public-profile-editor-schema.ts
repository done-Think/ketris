import { z } from 'zod'

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Informe uma cor hexadecimal válida')
  .or(z.literal(''))

const optionalUrlSchema = z.string().url('Informe uma URL válida').or(z.literal(''))

export const publicProfileEditorSchema = z.object({
  displayName: z.string().min(2, 'Informe o nome exibido no perfil'),
  headline: z.string(),
  bio: z.string(),
  creci: z.string(),
  phone: z.string(),
  region: z.string(),
  neighborhoods: z.string(),
  specialties: z.string(),
  availability: z.string(),
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  backgroundColor: hexColorSchema,
  avatarUrl: optionalUrlSchema,
  bannerUrl: optionalUrlSchema,
})

export type PublicProfileEditorFormValues = z.infer<typeof publicProfileEditorSchema>
