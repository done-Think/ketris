import '@server/openapi/zod-extend'
import { z } from 'zod'

export const agencyOverviewKpisSchema = z
  .object({
    portfolioCount: z.number().int(),
    activeBrokersCount: z.number().int(),
    receivedLeadsThisMonth: z.number().int(),
    monthlyReceivable: z.number(),
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
