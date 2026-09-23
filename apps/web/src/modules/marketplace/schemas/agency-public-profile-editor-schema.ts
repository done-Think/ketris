import { z } from 'zod'

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Informe uma cor hexadecimal válida')
  .or(z.literal(''))

const optionalUrlSchema = z.string().url('Informe uma URL válida').or(z.literal(''))

export const agencyTeamMemberFieldSchema = z.object({
  usuarioId: z.string(),
  name: z.string(),
})

export const agencyPublicProfileEditorSchema = z.object({
  displayName: z.string().min(2, 'Informe o nome da imobiliária'),
  headline: z.string(),
  summary: z.string(),
  legalCreci: z.string(),
  headquarters: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string().email('Informe um e-mail válido').or(z.literal('')),
  coverage: z.string(),
  segments: z.string(),
  yearsInMarket: z.string(),
  backgroundColor: hexColorSchema,
  logoUrl: optionalUrlSchema,
  bannerUrl: optionalUrlSchema,
  team: z.array(agencyTeamMemberFieldSchema).max(6, 'Selecione no máximo 6 corretores'),
})

export type AgencyPublicProfileEditorFormValues = z.infer<typeof agencyPublicProfileEditorSchema>
