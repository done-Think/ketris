import { z } from 'zod'

import type {
  PublicProfileEditorFormValues,
  PublicProfileSectionKey,
  PublicProfileSectionSlotKey,
} from '../types/public-profile-editor'

export const publicProfileSectionKeys = [
  'hero',
  'metrics',
  'team',
  'listings',
  'contact',
] as const satisfies PublicProfileSectionKey[]

export const publicProfileSectionSlotKeys = [
  ...publicProfileSectionKeys,
  'none',
] as const satisfies PublicProfileSectionSlotKey[]

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Informe uma cor hexadecimal válida')

const urlSchema = z.string().url('Informe uma URL válida')

const publicProfileTeamMemberSchema = z.object({
  name: z.string().min(2, 'Informe o nome do membro'),
  role: z.string().min(2, 'Informe a função do membro'),
  avatarUrl: urlSchema,
  profileUrl: z.string().min(1, 'Informe o link do perfil'),
})

export const publicProfileEditorSchema = z.object({
  displayName: z.string().min(2, 'Informe o nome exibido no perfil'),
  headline: z.string().min(8, 'Informe uma chamada para o banner'),
  summary: z.string().min(20, 'Informe um resumo mais completo'),
  primaryColor: hexColorSchema,
  accentColor: hexColorSchema,
  backgroundColor: hexColorSchema,
  avatarUrl: urlSchema,
  bannerUrl: urlSchema,
  teamMembers: z.array(publicProfileTeamMemberSchema).max(6, 'Adicione no máximo 6 membros'),
  sectionOrder: z
    .array(z.enum(publicProfileSectionSlotKeys))
    .length(publicProfileSectionKeys.length)
    .refine((sections) => {
      const selectedSections = sections.filter((section) => section !== 'none')

      return new Set(selectedSections).size === selectedSections.length
    }, 'Cada seção selecionada deve aparecer uma única vez'),
}) satisfies z.ZodType<PublicProfileEditorFormValues>
