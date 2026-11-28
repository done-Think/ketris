import type { CrmInteraction, StartInteractionInput } from './interaction'

export type StartLeadInteractionInput = StartInteractionInput & { leadId: string }
export type StartLeadInteractionOutput = CrmInteraction
