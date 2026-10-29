import '@server/openapi/zod-extend'
import { z } from 'zod'

import {
  maintenanceCategorySchema,
  maintenanceTicketPrioritySchema,
  maintenanceTicketStatusSchema,
} from './maintenance-ticket.schema'

const maintenanceScheduleDateSchema = z.string().datetime({ offset: true })
const optionalMaintenanceScheduleSchema = maintenanceScheduleDateSchema
  .transform((value) => new Date(value))
  .nullable()
  .optional()

export const createMaintenanceTicketRequestSchema = z
  .object({
    contractId: z.string().trim().min(1),
    propertyId: z.string().trim().min(1).optional(),
    category: maintenanceCategorySchema,
    priority: maintenanceTicketPrioritySchema,
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(10000),
    scheduledAt: optionalMaintenanceScheduleSchema,
  })
  .strict()
  .openapi('CreateMaintenanceTicketRequest')

export const updateMaintenanceTicketRequestSchema = z
  .object({
    propertyId: z.string().trim().min(1).optional(),
    contractId: z.string().trim().min(1).optional(),
    category: maintenanceCategorySchema.optional(),
    priority: maintenanceTicketPrioritySchema.optional(),
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(10000).optional(),
    scheduledAt: optionalMaintenanceScheduleSchema,
  })
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Informe ao menos um campo para atualizar.',
  })
  .openapi('UpdateMaintenanceTicketRequest')

export const addMaintenanceTicketNoteRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(10000),
  })
  .strict()
  .openapi('AddMaintenanceTicketNoteRequest')

export const listMaintenanceTicketsQuerySchema = z
  .object({
    status: maintenanceTicketStatusSchema.optional(),
    priority: maintenanceTicketPrioritySchema.optional(),
    category: maintenanceCategorySchema.optional(),
    propertyId: z.string().trim().min(1).optional(),
    search: z.string().trim().min(1).max(500).optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
    locale: z.enum(['pt-BR', 'en-US', 'es-ES']).optional(),
    archived: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  })
  .strict()
  .openapi('ListMaintenanceTicketsQuery')

export const maintenanceProviderSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).max(200),
    phone: z.string().trim().max(50).nullable().optional(),
    email: z.string().trim().email().max(254).nullable().optional(),
    notes: z.string().trim().max(5000).nullable().optional(),
  })
  .strict()

export const maintenanceProviderSelectionSchema = maintenanceProviderSchema
  .partial({ name: true })
  .refine((value) => Boolean(value.id || value.name), {
    message: 'Selecione um prestador ou informe seus dados.',
  })
  .transform((value) => ({ ...value, name: value.name ?? '' }))

const reason = z.string().trim().min(1).max(5000)
export const maintenanceActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('linkContract'), contractId: z.string().trim().min(1) }).strict(),
  z.object({ action: z.literal('schedule'), scheduledAt: maintenanceScheduleDateSchema }).strict(),
  z.object({ action: z.literal('start') }).strict(),
  z.object({ action: z.literal('complete') }).strict(),
  z.object({ action: z.literal('finish') }).strict(),
  z.object({ action: z.literal('confirm') }).strict(),
  z.object({ action: z.literal('cancel') }).strict(),
  z.object({ action: z.literal('assume') }).strict(),
  z.object({ action: z.literal('restore') }).strict(),
  z.object({ action: z.literal('contest'), reason }).strict(),
  z
    .object({
      action: z.literal('reopen'),
      status: z.enum(['OPEN', 'IN_PROGRESS']),
      reason: reason.optional(),
    })
    .strict(),
  z.object({ action: z.literal('assign'), responsibleId: z.string().min(1) }).strict(),
  z
    .object({ action: z.literal('provider'), provider: maintenanceProviderSelectionSchema })
    .strict(),
  z.object({ action: z.literal('requestReplacement'), reason }).strict(),
  z
    .object({
      action: z.literal('approveReplacement'),
      requestId: z.string().min(1),
      provider: maintenanceProviderSelectionSchema,
    })
    .strict(),
  z
    .object({ action: z.literal('rejectReplacement'), requestId: z.string().min(1), reason })
    .strict(),
])

export const maintenanceLinksSchema = z
  .object({
    contractId: z.string().min(1),
    ownerId: z.string().min(1).optional(),
    partyId: z.string().min(1).optional(),
    renterId: z.string().min(1).optional(),
  })
  .strict()
  .refine(
    (input) => Boolean(input.ownerId || (input.partyId && input.renterId)),
    'Informe um vinculo.',
  )
  .refine(
    (input) => Boolean(input.partyId) === Boolean(input.renterId),
    'Informe a parte e o usuario locatario juntos.',
  )
