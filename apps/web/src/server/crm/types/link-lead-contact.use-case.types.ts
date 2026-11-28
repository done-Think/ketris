import type { z } from 'zod'
import type { linkLeadContactSchema } from '../schemas/lead-contact.schema'
import type { CrmScope } from './prisma'
import type { Lead } from '../domain/lead.entity'

export type LinkLeadContactInput = CrmScope &
  z.infer<typeof linkLeadContactSchema> & { leadId: string; actorId: string }
export type LinkLeadContactOutput = Lead
