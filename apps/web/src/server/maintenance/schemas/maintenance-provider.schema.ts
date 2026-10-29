import { validationRefinement } from '@server/shared/http/validation-messages'
import '@server/openapi/zod-extend'
import { z } from 'zod'
import { maintenanceProviderSchema } from './maintenance-ticket-input.schema'

export const maintenanceProviderDataSchema = maintenanceProviderSchema.omit({ id: true })
export const maintenanceProviderRecordSchema = maintenanceProviderDataSchema
  .extend({
    id: z.string(),
    active: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi('MaintenanceProviderRecord')

export const listMaintenanceProvidersQuerySchema = z
  .object({
    ticketId: z.string().trim().min(1).optional(),
    search: z.string().trim().max(500).optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(5),
    includeInactive: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  })
  .strict()
  .openapi('ListMaintenanceProvidersQuery')

export const createMaintenanceProviderRequestSchema = z
  .object({
    ticketId: z.string().trim().min(1).optional(),
    provider: maintenanceProviderDataSchema,
  })
  .strict()
  .openapi('CreateMaintenanceProviderRequest')

export const updateMaintenanceProviderRequestSchema = maintenanceProviderDataSchema
  .partial()
  .extend({
    active: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    ...validationRefinement('updateRequired'),
  })
  .openapi('UpdateMaintenanceProviderRequest')

export const maintenanceProviderResponseSchema = z
  .object({ provider: maintenanceProviderRecordSchema })
  .openapi('MaintenanceProviderResponse')
export const maintenanceProvidersResponseSchema = z
  .object({
    items: z.array(maintenanceProviderRecordSchema),
    totalCount: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
  })
  .openapi('MaintenanceProvidersResponse')
