import '@server/openapi/zod-extend'
import { z } from 'zod'

import {
  maintenanceTicketPrioritySchema,
  maintenanceTicketStatusSchema,
} from './maintenance-ticket.schema'

export const createMaintenanceTicketRequestSchema = z
  .object({
    contractId: z.string().trim().min(1),
    propertyId: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1),
    priority: maintenanceTicketPrioritySchema,
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
  })
  .openapi('CreateMaintenanceTicketRequest')

export const updateMaintenanceTicketRequestSchema = z
  .object({
    propertyId: z.string().trim().min(1).optional(),
    contractId: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    priority: maintenanceTicketPrioritySchema.optional(),
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Informe ao menos um campo para atualizar.',
  })
  .openapi('UpdateMaintenanceTicketRequest')

export const addMaintenanceTicketNoteRequestSchema = z
  .object({
    message: z.string().trim().min(1),
  })
  .openapi('AddMaintenanceTicketNoteRequest')

export const listMaintenanceTicketsQuerySchema = z
  .object({
    status: maintenanceTicketStatusSchema.optional(),
    priority: maintenanceTicketPrioritySchema.optional(),
    propertyId: z.string().trim().min(1).optional(),
    search: z.string().trim().min(1).optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
    archived: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  })
  .openapi('ListMaintenanceTicketsQuery')

export const maintenanceProviderSchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(50).nullable().optional(),
  email: z.string().trim().email().max(254).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
})

const reason = z.string().trim().min(1).max(5000)
export const maintenanceActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start') }),
  z.object({ action: z.literal('complete') }),
  z.object({ action: z.literal('confirm') }),
  z.object({ action: z.literal('cancel') }),
  z.object({ action: z.literal('assume') }),
  z.object({ action: z.literal('restore') }),
  z.object({ action: z.literal('contest'), reason }),
  z.object({ action: z.literal('reopen'), status: z.enum(['ABERTO', 'EM_ANDAMENTO']) }),
  z.object({ action: z.literal('assign'), responsibleId: z.string().min(1) }),
  z.object({ action: z.literal('provider'), provider: maintenanceProviderSchema }),
  z.object({ action: z.literal('requestReplacement'), reason }),
  z.object({
    action: z.literal('approveReplacement'),
    requestId: z.string().min(1),
    provider: maintenanceProviderSchema,
  }),
  z.object({ action: z.literal('rejectReplacement'), requestId: z.string().min(1), reason }),
])

export const maintenanceLinksSchema = z
  .object({
    contractId: z.string().min(1),
    ownerId: z.string().min(1).optional(),
    partyId: z.string().min(1).optional(),
    renterId: z.string().min(1).optional(),
  })
  .refine(
    (input) => Boolean(input.ownerId || (input.partyId && input.renterId)),
    'Informe um vinculo.',
  )
  .refine(
    (input) => Boolean(input.partyId) === Boolean(input.renterId),
    'Informe a parte e o usuario locatario juntos.',
  )
