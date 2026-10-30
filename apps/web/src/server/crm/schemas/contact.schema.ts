import { validationRefinement } from '@server/shared/http/validation-messages'
import { crmDateSchema } from './crm-date.schema'
import '@server/openapi/zod-extend'
import { z } from 'zod'
import { crmEmailSchema, crmNameSchema, crmNotesSchema, crmPhoneSchema } from './crm-input.schema'
import { crmGroupsSchema, crmListQuerySchema, crmPaginationSchema } from './pagination.schema'

export const contactTypeSchema = z.enum(['OWNER', 'RENTER', 'BROKER']).openapi('ContactType')

export const contactSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    createdById: z.string().nullable().optional(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string().nullable(),
    type: contactTypeSchema,
    avatarUrl: z.string().nullable(),
    notes: z.string().nullable(),
    lastInteraction: z.coerce.date().nullable(),
    archivedAt: z.coerce.date().nullable(),
    createdAt: crmDateSchema,
    updatedAt: crmDateSchema,
  })
  .openapi('Contact')

export const contactListItemSchema = contactSchema
  .extend({
    propertyCount: z.number().int().openapi({
      description:
        'Quantidade de imóveis distintos nas oportunidades não arquivadas visíveis deste contato.',
    }),
  })
  .openapi('ContactListItem')

export const listContactsQuerySchema = z
  .object({
    ...crmListQuerySchema.shape,
    sortBy: z.enum(['name', 'type', 'lastInteraction', 'createdAt']).optional(),
    type: contactTypeSchema.optional(),
    q: z.string().min(1).optional(),
    includeArchived: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  })
  .strict()
  .openapi('ListContactsQuery')

export const listContactsResponseSchema = z
  .object({
    contacts: z.array(contactListItemSchema),
    pagination: crmPaginationSchema,
    groups: crmGroupsSchema,
  })
  .openapi('ListContactsResponse')

export const contactResponseSchema = z.object({ contact: contactSchema }).openapi('ContactResponse')

const name = crmNameSchema
const email = crmEmailSchema
const phone = crmPhoneSchema.nullable()
const avatarUrl = z
  .string()
  .max(2048)
  .url()
  .refine((value) => /^https?:\/\//i.test(value), validationRefinement('urlInvalid'))
  .nullable()
const notes = crmNotesSchema.nullable()

export const createContactRequestSchema = z
  .object({
    name,
    email,
    phone: phone.optional(),
    type: contactTypeSchema.optional(),
    avatarUrl: avatarUrl.optional(),
    notes: notes.optional(),
  })
  .strict()
  .openapi('CreateContactRequest')

export const patchContactRequestSchema = z
  .object({
    name: name.optional(),
    email: email.optional(),
    phone: phone.optional(),
    type: contactTypeSchema.optional(),
    avatarUrl: avatarUrl.optional(),
    notes: notes.optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    ...validationRefinement('updateRequired'),
  })
  .openapi('PatchContactRequest')
