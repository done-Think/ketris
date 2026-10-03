import '@server/openapi/zod-extend'
import { z } from 'zod'

import {
  maintenanceTicketPrioritySchema,
  maintenanceTicketStatusSchema,
} from './maintenance-ticket.schema'

export const createMaintenanceTicketRequestSchema = z
  .object({
    propertyId: z.string().trim().min(1),
    category: z.string().trim().min(1),
    priority: maintenanceTicketPrioritySchema,
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
  })
  .openapi('CreateMaintenanceTicketRequest')

export const updateMaintenanceTicketRequestSchema = z
  .object({
    propertyId: z.string().trim().min(1).optional(),
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
    propertyId: z.string().trim().min(1).optional(),
    search: z.string().trim().min(1).optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  })
  .openapi('ListMaintenanceTicketsQuery')

export type CreateMaintenanceTicketRequestDTO = z.infer<typeof createMaintenanceTicketRequestSchema>
export type UpdateMaintenanceTicketRequestDTO = z.infer<typeof updateMaintenanceTicketRequestSchema>
export type AddMaintenanceTicketNoteRequestDTO = z.infer<
  typeof addMaintenanceTicketNoteRequestSchema
>
export type ListMaintenanceTicketsQueryDTO = z.infer<typeof listMaintenanceTicketsQuerySchema>
