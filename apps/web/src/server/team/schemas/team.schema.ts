import '@server/openapi/zod-extend'
import { z } from 'zod'

import { locales } from '@/i18n/routing'
import { createNewPasswordSchema } from '@shared/schemas/new-password-schema'

export const teamMemberIdParamsSchema = z.object({ id: z.string().trim().min(1).max(64) }).strict()

export const setBrokerGoalRequestSchema = z
  .object({
    monthlySales: z.number().int().min(1).max(10000).openapi({ example: 8 }),
  })
  .strict()
  .openapi('SetBrokerGoalRequest')

export const transferBrokerPortfolioRequestSchema = z
  .object({
    destinationId: z.string().trim().min(1).max(64),
    properties: z.boolean(),
    leads: z.boolean(),
    opportunities: z.boolean(),
    futureEvents: z.boolean(),
  })
  .strict()
  .openapi('TransferBrokerPortfolioRequest')

export const deactivateBrokerRequestSchema = z
  .object({ destinationId: z.string().trim().min(1).max(64) })
  .strict()
  .openapi('DeactivateBrokerRequest')

export const inviteBrokerRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120).openapi({ example: 'Marina Costa' }),
    email: z.string().trim().max(254).email().openapi({ example: 'marina@imobiliaria.com.br' }),
    locale: z.enum(locales).openapi({ example: 'pt-BR' }),
  })
  .strict()
  .openapi('InviteBrokerRequest')

export const resendTeamInvitationRequestSchema = z
  .object({ locale: z.enum(locales) })
  .strict()
  .openapi('ResendTeamInvitationRequest')

export const teamInvitationTokenQuerySchema = z
  .object({ token: z.string().trim().min(16).max(128) })
  .strict()
  .openapi('TeamInvitationTokenQuery')

export const acceptTeamInvitationRequestSchema = z
  .object({
    token: z.string().trim().min(16).max(128),
    password: createNewPasswordSchema((key) =>
      key === 'passwordTooLong'
        ? 'Senha muito longa. Use menos caracteres.'
        : 'Senha deve ter pelo menos 8 caracteres.',
    ),
  })
  .strict()
  .openapi('AcceptTeamInvitationRequest')

const teamMemberSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    headline: z.string().nullable(),
    specialties: z.array(z.string()),
    hasPublicProfile: z.boolean(),
    active: z.boolean(),
    invitation: z
      .object({
        status: z.enum(['PENDING', 'EXPIRED']),
        sentAt: z.string(),
        expiresAt: z.string(),
      })
      .nullable(),
    metrics: z.object({
      properties: z.number().int(),
      openLeads: z.number().int(),
      openOpportunities: z.number().int(),
      monthlySales: z.number().int(),
      returns: z.number().int(),
      responseTimeMinutes: z
        .number()
        .int()
        .nullable()
        .openapi({ description: 'Mediana dos últimos 30 dias; null sem dados.' }),
    }),
    goal: z
      .object({ monthlySales: z.number().int(), setAt: z.string(), setByName: z.string() })
      .nullable(),
    pace: z.object({
      status: z.enum(['AHEAD', 'ON_TRACK', 'ATTENTION', 'NO_GOAL']),
      expectedSales: z.number().nullable(),
      goalProgress: z.number().int().nullable(),
    }),
  })
  .openapi('TeamMember')

export const teamOverviewResponseSchema = z
  .object({
    month: z.string().openapi({ example: '2026-10' }),
    members: z.array(teamMemberSchema),
    summary: z.object({
      activeBrokers: z.number().int(),
      properties: z.number().int(),
      monthlySales: z.number().int(),
      averageGoalProgress: z.number().int().nullable(),
    }),
  })
  .openapi('TeamOverviewResponse')

export const teamGoalChangeSchema = z
  .object({
    id: z.string(),
    monthlySales: z.number().int(),
    setAt: z.string(),
    setByName: z.string(),
  })
  .openapi('TeamGoalChange')

export const teamTransferResponseSchema = z
  .object({
    properties: z.number().int(),
    leads: z.number().int(),
    opportunities: z.number().int(),
    futureEvents: z.number().int(),
  })
  .openapi('TeamTransferResponse')

export const inviteBrokerResponseSchema = z
  .object({ brokerId: z.string(), emailDelivered: z.boolean() })
  .openapi('InviteBrokerResponse')

export const teamInvitationPreviewSchema = z
  .object({
    name: z.string(),
    email: z.string(),
    agencyName: z.string(),
    status: z.enum(['VALID', 'EXPIRED', 'ACCEPTED']),
  })
  .openapi('TeamInvitationPreview')
