import '@server/openapi/zod-extend'
import { z } from 'zod'

const optionalTextSchema = z.string().trim().min(1).nullable().optional()

export const saveAgencyProfileTeamMemberSchema = z
  .object({
    usuarioId: z.string().min(1),
    order: z.number().int().nonnegative(),
  })
  .openapi('SaveAgencyProfileTeamMember')

export const saveAgencyProfileRequestSchema = z
  .object({
    displayName: z.string().trim().min(1),
    headline: optionalTextSchema,
    summary: optionalTextSchema,
    legalCreci: optionalTextSchema,
    headquarters: optionalTextSchema,
    address: optionalTextSchema,
    phone: optionalTextSchema,
    email: z.string().trim().email().nullable().optional(),
    coverage: z.array(z.string().trim().min(1)).default([]),
    segments: z.array(z.string().trim().min(1)).default([]),
    yearsInMarket: z.number().int().nonnegative().nullable().optional(),
    backgroundColor: z
      .string()
      .trim()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .nullable()
      .optional(),
    logoUrl: z.string().trim().min(1).nullable().optional(),
    bannerUrl: z.string().trim().min(1).nullable().optional(),
    team: z.array(saveAgencyProfileTeamMemberSchema).max(6).default([]),
  })
  .openapi('SaveAgencyProfileRequest')

export type SaveAgencyProfileRequestDTO = z.infer<typeof saveAgencyProfileRequestSchema>

export const agencyListingSummarySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    purpose: z.enum(['ALUGUEL', 'VENDA']),
    price: z.number(),
    neighborhood: z.string().nullable(),
    city: z.string().nullable(),
    coverUrl: z.string().nullable(),
  })
  .openapi('AgencyListingSummary')

export const agencyTeamHighlightSchema = z
  .object({
    usuarioId: z.string(),
    name: z.string(),
    avatarUrl: z.string().nullable(),
    order: z.number(),
  })
  .openapi('AgencyTeamHighlight')

export const publicAgencyProfileSchema = z
  .object({
    id: z.string(),
    displayName: z.string(),
    headline: z.string().nullable(),
    summary: z.string().nullable(),
    legalCreci: z.string().nullable(),
    headquarters: z.string().nullable(),
    address: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    coverage: z.array(z.string()),
    segments: z.array(z.string()),
    yearsInMarket: z.number().nullable(),
    primaryColor: z.string().nullable(),
    secondaryColor: z.string().nullable(),
    backgroundColor: z.string().nullable(),
    logoUrl: z.string().nullable(),
    bannerUrl: z.string().nullable(),
    status: z.enum(['DRAFT', 'PUBLISHED']),
    publishedAt: z.date().nullable(),
    stats: z.object({
      activeListings: z.number(),
      brokersCount: z.number(),
      dealsClosed: z.number(),
    }),
    team: z.array(agencyTeamHighlightSchema),
    featuredListings: z.array(agencyListingSummarySchema),
  })
  .openapi('PublicAgencyProfile')
