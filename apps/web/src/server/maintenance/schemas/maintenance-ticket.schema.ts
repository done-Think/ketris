import '@server/openapi/zod-extend'
import { z } from 'zod'

export const maintenanceTicketStatusSchema = z.enum([
  'ABERTO',
  'EM_ANDAMENTO',
  'RESOLVIDO',
  'FECHADO',
  'AGUARDANDO_CONFIRMACAO',
  'CONTESTADO',
  'CANCELADO',
])

export const maintenanceTicketPrioritySchema = z.enum(['NORMAL', 'ALTA', 'URGENTE'])

export const maintenanceActivityTypeSchema = z.enum([
  'NOTA',
  'MUDANCA_STATUS',
  'ANEXO_ADICIONADO',
  'EDICAO',
  'RESPONSAVEL_ALTERADO',
  'PRESTADOR_ALTERADO',
  'TROCA_SOLICITADA',
  'TROCA_DECIDIDA',
  'EXCLUSAO',
  'RESTAURACAO',
])

export const maintenancePermissionsSchema = z.object({
  linkContract: z.boolean(),
  schedule: z.boolean(),
  edit: z.boolean(),
  comment: z.boolean(),
  collaborate: z.boolean(),
  assume: z.boolean(),
  assign: z.boolean(),
  provider: z.boolean(),
  requestReplacement: z.boolean(),
  start: z.boolean(),
  complete: z.boolean(),
  finish: z.boolean(),
  confirm: z.boolean(),
  contest: z.boolean(),
  cancel: z.boolean(),
  reopen: z.boolean(),
  delete: z.boolean(),
  restore: z.boolean(),
})

const providerSchema = z.object({
  name: z.string(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})
const replacementSchema = z.object({
  id: z.string(),
  reason: z.string(),
  requestedById: z.string(),
  requestedByName: z.string(),
  status: z.enum(['PENDENTE', 'APROVADA', 'REJEITADA']),
  decisionReason: z.string().nullable(),
  decidedByName: z.string().nullable(),
  decidedAt: z.string().nullable(),
  createdAt: z.string(),
})

export const maintenanceActivitySchema = z
  .object({
    id: z.string(),
    ticketId: z.string(),
    type: maintenanceActivityTypeSchema,
    message: z.string(),
    authorId: z.string().nullable(),
    authorName: z.string().nullable(),
    details: z.record(z.unknown()).nullable().optional(),
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
    scheduledAt: z.string().nullable(),
    id: z.string(),
    propertyId: z.string(),
    propertyTitle: z.string(),
    contractId: z.string().nullable(),
    responsibleId: z.string().nullable(),
    responsibleName: z.string().nullable(),
    provider: providerSchema.nullable(),
    completedByRole: z.enum(['OWNER', 'AGENT', 'RENTER', 'PROPERTY_OWNER']).nullable(),
    deletedAt: z.string().nullable(),
    replacementRequests: z.array(replacementSchema),
    permissions: maintenancePermissionsSchema,
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
    scheduledAt: z.string().nullable(),
    id: z.string(),
    propertyId: z.string(),
    propertyTitle: z.string(),
    contractId: z.string().nullable(),
    responsibleId: z.string().nullable(),
    responsibleName: z.string().nullable(),
    deletedAt: z.string().nullable(),
    permissions: maintenancePermissionsSchema,
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

export const maintenanceOptionsSchema = z.object({
  contracts: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      propertyId: z.string(),
      propertyTitle: z.string(),
      agentId: z.string(),
      ownerId: z.string().nullable(),
      renterIds: z.array(z.string()),
      parties: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          role: z.string(),
          userId: z.string().nullable(),
        }),
      ),
    }),
  ),
  users: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      role: z.enum(['OWNER', 'AGENT', 'RENTER', 'PROPERTY_OWNER']),
    }),
  ),
})
