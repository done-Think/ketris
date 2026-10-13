import '@server/openapi/zod-extend'
import { z } from 'zod'

export const maintenanceTicketStatusSchema = z.enum([
  'ABERTO',
  'EM_ANDAMENTO',
  'RESOLVIDO',
  'FECHADO',
])

export const maintenanceTicketPrioritySchema = z.enum(['NORMAL', 'ALTA', 'URGENTE'])

export const maintenanceActivityTypeSchema = z.enum(['NOTA', 'MUDANCA_STATUS', 'ANEXO_ADICIONADO'])

export const maintenanceActivitySchema = z
  .object({
    id: z.string(),
    ticketId: z.string(),
    type: maintenanceActivityTypeSchema,
    message: z.string(),
    authorId: z.string().nullable(),
    authorName: z.string().nullable(),
    createdAt: z.string(),
  })
  .openapi('MaintenanceActivity')

export const maintenanceAttachmentSchema = z
  .object({
    id: z.string(),
    ticketId: z.string(),
    name: z.string(),
    url: z.string(),
    createdAt: z.string(),
  })
  .openapi('MaintenanceAttachment')

export const maintenanceTicketSchema = z
  .object({
    id: z.string(),
    propertyId: z.string(),
    propertyTitle: z.string(),
    category: z.string(),
    priority: maintenanceTicketPrioritySchema,
    status: maintenanceTicketStatusSchema,
    title: z.string(),
    description: z.string(),
    openedById: z.string(),
    openedByName: z.string(),
    resolvedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    activities: z.array(maintenanceActivitySchema),
    attachments: z.array(maintenanceAttachmentSchema),
  })
  .openapi('MaintenanceTicket')

export const maintenanceTicketListItemSchema = z
  .object({
    id: z.string(),
    propertyId: z.string(),
    propertyTitle: z.string(),
    category: z.string(),
    priority: maintenanceTicketPrioritySchema,
    status: maintenanceTicketStatusSchema,
    title: z.string(),
    openedByName: z.string(),
    resolvedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi('MaintenanceTicketListItem')

export const maintenanceTicketIdParamsSchema = z
  .object({ id: z.string() })
  .openapi('MaintenanceTicketIdParams')

export const maintenanceTicketResponseSchema = z
  .object({ ticket: maintenanceTicketSchema })
  .openapi('MaintenanceTicketResponse')

export const maintenanceTicketsResponseSchema = z
  .object({ items: z.array(maintenanceTicketListItemSchema), totalCount: z.number() })
  .openapi('MaintenanceTicketsResponse')

export const maintenanceActivityResponseSchema = z
  .object({ activity: maintenanceActivitySchema })
  .openapi('MaintenanceActivityResponse')

export const maintenanceActivitiesResponseSchema = z
  .object({ activities: z.array(maintenanceActivitySchema) })
  .openapi('MaintenanceActivitiesResponse')
