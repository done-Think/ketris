import '@server/openapi/zod-extend'
import { z } from 'zod'

export const contactTypeSchema = z
  .enum(['PROPRIETARIO', 'LOCATARIO', 'CORRETOR'])
  .openapi('ContactType')

export const contactSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string().nullable(),
    type: contactTypeSchema,
    avatarUrl: z.string().nullable(),
    notes: z.string().nullable(),
    lastInteraction: z.coerce.date().nullable(),
    archivedAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .openapi('Contact')

export const contactListItemSchema = contactSchema
  .extend({
    propertyCount: z.number().int().openapi({
      description: 'Quantidade de oportunidades ativas vinculadas a este contato.',
    }),
  })
  .openapi('ContactListItem')

export const listContactsQuerySchema = z
  .object({
    type: contactTypeSchema.optional(),
    q: z.string().min(1).optional(),
    includeArchived: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  })
  .openapi('ListContactsQuery')

export const listContactsResponseSchema = z
  .object({ contacts: z.array(contactListItemSchema) })
  .openapi('ListContactsResponse')

export const contactResponseSchema = z.object({ contact: contactSchema }).openapi('ContactResponse')

const name = z.string().min(1, 'Nome é obrigatório.')
const email = z.string().email('E-mail inválido.')
const phone = z.string().min(1).nullable()
const avatarUrl = z.string().url('URL inválida.').nullable()
const notes = z.string().min(1).nullable()

export const createContactRequestSchema = z
  .object({
    name,
    email,
    phone: phone.optional(),
    type: contactTypeSchema.optional(),
    avatarUrl: avatarUrl.optional(),
    notes: notes.optional(),
  })
  .openapi('CreateContactRequest')

export const patchContactRequestSchema = z
  .object({
    name: name.optional(),
    email: email.optional(),
    phone: phone.optional(),
    type: contactTypeSchema.optional(),
    avatarUrl: avatarUrl.optional(),
    notes: notes.optional(),
    lastInteraction: z.coerce.date().nullable().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Informe ao menos um campo para atualizar.',
  })
  .openapi('PatchContactRequest')

export type CreateContactRequestDTO = z.infer<typeof createContactRequestSchema>
export type PatchContactRequestDTO = z.infer<typeof patchContactRequestSchema>
