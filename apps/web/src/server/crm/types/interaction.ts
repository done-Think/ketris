import type { z } from 'zod'
import type { CrmScope } from './prisma'
import type { crmInteractionSchema, startInteractionSchema } from '../schemas/interaction.schema'

export type InteractionTarget = { kind: 'lead' | 'contact' | 'opportunity'; id: string }
export type CrmInteraction = z.infer<typeof crmInteractionSchema>
export type StartInteractionInput = CrmScope &
  z.infer<typeof startInteractionSchema> & { leadId?: string; contactId?: string; actorId: string }
export interface InteractionPage {
  interactions: CrmInteraction[]
  pagination: { page: number; pageSize: number; pageCount: number; totalCount: number }
}
