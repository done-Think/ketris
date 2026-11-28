import type { z } from 'zod'
import type { createInteractionResultSchema } from '../schemas/interaction-result-schema'
import type {
  CompleteCrmInteractionRequestDTO,
  CrmInteractionChannelDTO,
  CrmInteractionDTO,
  CrmInteractionResponseDTO,
  CrmInteractionsPageDTO,
  StartCrmInteractionRequestDTO,
} from '@shared/types/generated/crm/dto'
import type { LeadContactDialogProps } from './lead'

export type CrmInteraction = CrmInteractionDTO
export type InteractionChannel = CrmInteractionChannelDTO
export type StartInteractionPayload = StartCrmInteractionRequestDTO
export type CompleteInteractionPayload = CompleteCrmInteractionRequestDTO
export type InteractionPage = CrmInteractionsPageDTO
export type InteractionResponse = CrmInteractionResponseDTO
export type InteractionTarget = { kind: 'lead' | 'contact' | 'opportunity'; id: string }
export interface InteractionHistoryProps {
  target: InteractionTarget
}
export interface InteractionResultFormProps {
  interaction: CrmInteraction
  onCancel: () => void
}
export interface ContactInteractionsDialogProps {
  attempt?: { isPending: boolean; isSuccess: boolean; failed: boolean; retry: () => void }
  contact: { id: string; name: string } | null
  onClose: () => void
}
export type TrackedLeadContactDialogProps = LeadContactDialogProps

export type InteractionResultFormValues = z.infer<ReturnType<typeof createInteractionResultSchema>>
