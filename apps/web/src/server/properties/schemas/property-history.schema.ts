import '@server/openapi/zod-extend'
import { z } from 'zod'
import { propertyHistoryActions, propertyHistoryFields } from '../domain/property-history'
import { propertyAddressSchema } from './property.schema'

const media = z.object({ url: z.string(), type: z.string(), position: z.number().int() })
const person = z.object({ id: z.string(), name: z.string().nullable() })
export const propertyHistoryNonNullValueSchema = z
  .union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.array(media),
    z.array(person),
    propertyAddressSchema,
    person,
  ])
  .openapi('PropertyHistoryNonNullValue')
export const propertyHistoryValueSchema = propertyHistoryNonNullValueSchema
  .nullable()
  .openapi('PropertyHistoryValue', {
    anyOf: [
      { $ref: '#/components/schemas/PropertyHistoryNonNullValue' },
      { type: 'string', nullable: true, enum: [null] },
    ],
  })
export const propertyHistoryChangeSchema = z.object({
  field: z.enum(propertyHistoryFields),
  before: propertyHistoryValueSchema,
  after: propertyHistoryValueSchema,
})
export const propertyHistorySummarySchema = z
  .object({
    id: z.string(),
    action: z.enum(propertyHistoryActions),
    actorName: z.string().nullable(),
    actorRole: z.string().nullable(),
    createdAt: z.string(),
    fields: z.array(z.enum(propertyHistoryFields)),
  })
  .openapi('PropertyHistorySummary')
export const propertyHistoryEventSchema = propertyHistorySummarySchema
  .extend({
    changes: z.array(propertyHistoryChangeSchema),
  })
  .openapi('PropertyHistoryEvent')
export const propertyHistoryResponseSchema = z
  .object({ event: propertyHistoryEventSchema })
  .openapi('PropertyHistoryResponse')
export const propertyHistoryPageSchema = z
  .object({
    events: z.array(propertyHistorySummarySchema),
    pagination: z.object({
      page: z.number(),
      pageSize: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi('PropertyHistoryPage')
export const propertyHistoryQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().max(1000000).default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
  })
  .openapi('PropertyHistoryQuery')
export const propertyHistoryParamsSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
})
