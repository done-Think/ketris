import '@server/openapi/zod-extend'
import { z } from 'zod'

export const agencyOverviewKpisSchema = z
  .object({
    portfolioCount: z.number().int(),
    newPropertiesThisMonth: z
      .number()
      .int()
      .openapi({ description: 'Imóveis cadastrados no mês corrente.' }),
    activeBrokersCount: z.number().int(),
    receivedLeadsThisMonth: z.number().int(),
    receivedLeadsPreviousPeriod: z.number().int().openapi({
      description:
        'Leads recebidos no mesmo trecho do mês anterior (do dia 1 até o mesmo dia/hora de hoje).',
    }),
    monthlyReceivable: z.number(),
    monthlyReceivablePreviousMonth: z.number().openapi({
      description: 'Mesmo cálculo de monthlyReceivable, aplicado ao mês anterior inteiro.',
    }),
    overdueTotal: z.number().openapi({
      description: 'Soma das cobranças a receber vencidas e não pagas (do resumo financeiro).',
    }),
    occupancyPercentage: z.number(),
  })
  .openapi('AgencyOverviewKpis')

export const agencyRevenueMonthSchema = z
  .object({
    year: z.number().int(),
    month: z.number().int(),
    total: z.number(),
  })
  .openapi('AgencyRevenueMonth')

export const agencyBrokerSaleSchema = z
  .object({
    id: z.string(),
    propertyId: z.string(),
    propertyTitle: z.string(),
    location: z.string().nullable(),
    value: z.number(),
    closedAt: z.string(),
  })
  .openapi('AgencyBrokerSale')

export const agencyTopBrokerSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    avatarUrl: z.string().nullable(),
    hasPublicProfile: z.boolean(),
    salesCount: z.number().int(),
    revenueTotal: z.number(),
    recentSales: z.array(agencyBrokerSaleSchema),
  })
  .openapi('AgencyTopBroker')

export const agencyActivityTypeSchema = z.enum(['CONTRACT', 'PROPERTY', 'VISIT', 'LEAD'])

export const agencyActivitySchema = z
  .object({
    id: z.string(),
    type: agencyActivityTypeSchema,
    brokerName: z.string(),
    detail: z.string(),
    occurredAt: z.string(),
  })
  .openapi('AgencyActivity')

export const agencyOverviewResponseSchema = z
  .object({
    kpis: agencyOverviewKpisSchema,
    revenueSeries: z.array(agencyRevenueMonthSchema),
    topBrokers: z.array(agencyTopBrokerSchema),
    recentActivities: z.array(agencyActivitySchema),
  })
  .openapi('AgencyOverviewResponse')
