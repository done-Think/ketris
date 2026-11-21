import type { CompleteInteractionInput } from '../../types/complete-interaction.use-case.types'
import type {
  CrmInteraction,
  InteractionPage,
  StartInteractionInput,
} from '../../types/interaction'
import type { ListInteractionsInput } from '../../types/list-interactions.use-case.types'

export interface InteractionRepository {
  findById(id: string): Promise<CrmInteraction | null>
  findByRequestId(requestId: string): Promise<CrmInteraction | null>
  start(input: StartInteractionInput): Promise<CrmInteraction>
  complete(input: CompleteInteractionInput): Promise<CrmInteraction>
  list(input: ListInteractionsInput): Promise<InteractionPage>
}
