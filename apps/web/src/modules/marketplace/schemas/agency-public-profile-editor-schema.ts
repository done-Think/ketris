import { z } from 'zod'

import type {
  AgencyPublicProfileEditorFormValues,
  AgencyPublicProfileSectionKey,
  AgencyPublicProfileSectionSlotKey,
} from '../types/agency-public-profile-editor'

export const agencyPublicProfileSectionKeys = [
  'brand',
  'metrics',
  'contact',
  'team',
  'listings',
] as const satisfies AgencyPublicProfileSectionKey[]

export const agencyPublicProfileSectionSlotKeys = [
  ...agencyPublicProfileSectionKeys,
  'none',
] as const satisfies AgencyPublicProfileSectionSlotKey[]

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Informe uma cor hexadecimal válida')
const urlSchema = z.string().url('Informe uma URL válida')

export const agencyPublicProfileEditorSchema = z.object({
  displayName: z.string().min(2, 'Informe o nome da imobiliária'),
  headline: z.string().min(4, 'Informe uma chamada institucional'),
  summary: z.string().min(20, 'Informe um resumo mais completo'),
  legalCreci: z.string().min(4, 'Informe o CRECI da imobiliária'),
  headquarters: z.string().min(4, 'Informe a sede da imobiliária'),
  address: z.string().min(8, 'Informe o endereço'),
  coverage: z.string().min(4, 'Informe a cobertura de bairros'),
  segments: z.string().min(4, 'Informe os segmentos de atuação'),
  primaryColor: hexColorSchema,
  accentColor: hexColorSchema,
  backgroundColor: hexColorSchema,
  logoUrl: urlSchema,
  bannerUrl: urlSchema,
  sectionOrder: z
    .array(z.enum(agencyPublicProfileSectionSlotKeys))
    .length(agencyPublicProfileSectionKeys.length)
    .refine((sections) => {
      const selectedSections = sections.filter((section) => section !== 'none')

      return new Set(selectedSections).size === selectedSections.length
    }, 'Cada seção selecionada deve aparecer uma única vez'),
}) satisfies z.ZodType<AgencyPublicProfileEditorFormValues>
