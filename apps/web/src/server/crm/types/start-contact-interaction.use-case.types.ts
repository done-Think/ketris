import type { CrmInteraction, StartInteractionInput } from './interaction'

export type StartContactInteractionInput = StartInteractionInput & { contactId: string }
export type StartContactInteractionOutput = CrmInteraction
