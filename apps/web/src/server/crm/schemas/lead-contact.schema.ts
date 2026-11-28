import '@server/openapi/zod-extend'
import { z } from 'zod'
import { createContactRequestSchema } from './contact.schema'

export const linkLeadContactSchema = z
  .union([
    z.object({ contactId: z.string().trim().min(1) }).strict(),
    z.object({ contact: createContactRequestSchema }).strict(),
  ])
  .openapi('LinkLeadContactRequest')
