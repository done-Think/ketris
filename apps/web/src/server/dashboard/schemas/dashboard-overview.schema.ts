import { LEAD_SOURCES } from '@server/crm/constants/lead-sources'
import '@server/openapi/zod-extend'
import { z } from 'zod'

export const dashboardMetricsSchema = z
  .object({
    activeLeads: z
      .number()
      .int()
      .openapi({ description: 'Leads ainda não convertidos em oportunidade.' }),
    activeLeadsCreatedToday: z.number().int(),
    visitsThisMonth: z
      .number()
      .int()
      .openapi({ description: 'Visitas não canceladas no mês corrente (America/Sao_Paulo).' }),
    visitsToday: z.number().int(),
    openProposals: z
      .number()
      .int()
      .openapi({ description: 'Oportunidades não arquivadas em ENVIADA ou EM_NEGOCIACAO.' }),
    proposalsAwaitingResponse: z
      .number()
      .int()
      .openapi({ description: 'Oportunidades em ENVIADA.' }),
  })
  .openapi('DashboardMetrics')

export const dashboardRecentLeadSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    phone: z.string(),
    interest: z.string(),
    budget: z.string(),
    source: z.enum(LEAD_SOURCES),
    stage: z.enum(['NOVO', 'EM_CONTATO', 'VISITA_MARCADA', 'PROPOSTA']),
    notes: z.string().nullable(),
    createdAt: z.string(),
  })
  .openapi('DashboardRecentLead')

export const dashboardActivityPropertySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    price: z.number(),
    address: z
      .object({
        street: z.string(),
        number: z.string(),
        neighborhood: z.string(),
        city: z.string(),
      })
      .nullable(),
  })
  .openapi('DashboardActivityProperty', {
    description:
      'Resumo do imóvel vinculado ao evento. Só vem preenchido quando o imóvel está publicado.',
  })

export const dashboardUpcomingActivitySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    kind: z.enum(['VISIT', 'FOLLOW_UP', 'MEETING', 'INSPECTION', 'SIGNATURE', 'OTHER']).nullable(),
    start: z.string(),
    end: z.string(),
    participantName: z.string(),
    participantPhone: z.string(),
    notes: z.string().nullable(),
    propertyId: z.string().nullable(),
    propertyReference: z.string().nullable(),
    property: dashboardActivityPropertySchema.nullable(),
  })
  .openapi('DashboardUpcomingActivity')

export const dashboardOverviewResponseSchema = z
  .object({
    metrics: dashboardMetricsSchema,
    recentLeads: z.array(dashboardRecentLeadSchema),
    upcomingActivities: z.array(dashboardUpcomingActivitySchema),
  })
  .openapi('DashboardOverviewResponse')
