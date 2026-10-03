import '@server/openapi/zod-extend'
import { z } from 'zod'

const optionalTextSchema = z.string().trim().min(1).nullable().optional()
const colorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .nullable()
  .optional()

export const saveBrokerProfileRequestSchema = z
  .object({
    displayName: z.string().trim().min(1),
    headline: optionalTextSchema,
    bio: optionalTextSchema,
    creci: optionalTextSchema,
    phone: optionalTextSchema,
    region: optionalTextSchema,
    neighborhoods: z.array(z.string().trim().min(1)).default([]),
    specialties: z.array(z.string().trim().min(1)).default([]),
    availability: optionalTextSchema,
    primaryColor: colorSchema,
    secondaryColor: colorSchema,
    backgroundColor: colorSchema,
    avatarUrl: z.string().trim().min(1).nullable().optional(),
    bannerUrl: z.string().trim().min(1).nullable().optional(),
  })
  .openapi('SaveBrokerProfileRequest')

export type SaveBrokerProfileRequestDTO = z.infer<typeof saveBrokerProfileRequestSchema>

export const brokerListingSummarySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    purpose: z.enum(['ALUGUEL', 'VENDA']),
    price: z.number(),
    neighborhood: z.string().nullable(),
    city: z.string().nullable(),
    coverUrl: z.string().nullable(),
  })
  .openapi('BrokerListingSummary')

export const publicBrokerProfileSchema = z
  .object({
    id: z.string(),
    agencyName: z.string(),
    email: z.string(),
    displayName: z.string(),
    headline: z.string().nullable(),
    bio: z.string().nullable(),
    creci: z.string().nullable(),
    phone: z.string().nullable(),
    region: z.string().nullable(),
    neighborhoods: z.array(z.string()),
    specialties: z.array(z.string()),
    availability: z.string().nullable(),
    primaryColor: z.string().nullable(),
    secondaryColor: z.string().nullable(),
    backgroundColor: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    bannerUrl: z.string().nullable(),
    status: z.enum(['DRAFT', 'PUBLISHED']),
    publishedAt: z.date().nullable(),
    stats: z.object({ activeListings: z.number(), dealsClosed: z.number() }),
    recentListings: z.array(brokerListingSummarySchema),
  })
  .openapi('PublicBrokerProfile')
