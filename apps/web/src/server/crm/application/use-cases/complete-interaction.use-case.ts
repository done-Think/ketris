import type {
  CompleteInteractionInput,
  CompleteInteractionOutput,
} from '../../types/complete-interaction.use-case.types'
export type {
  CompleteInteractionInput,
  CompleteInteractionOutput,
} from '../../types/complete-interaction.use-case.types'

import { isAgencyManager } from '@server/auth/domain/roles'
import { ForbiddenError } from '@server/shared/errors'
import { InteractionConflictError, InteractionNotFoundError } from '../../domain/errors'
import { assertCrmAccess } from '../authorization'
import type { InteractionRepository } from '../ports/interaction-repository.port'

export class CompleteInteractionUseCase {
  constructor(private readonly repository: InteractionRepository) {}

  async execute(input: CompleteInteractionInput): Promise<CompleteInteractionOutput> {
    assertCrmAccess(input.actorRole)
    const interaction = await this.repository.findById(input.interactionId)
    if (!interaction) throw new InteractionNotFoundError()
    if (interaction.actorUserId !== input.actorId && !isAgencyManager(input.actorRole))
      throw new ForbiddenError()
    if (interaction.kind && interaction.kind !== 'CONTACT_ATTEMPT')
      throw new InteractionConflictError()
    if (interaction.status !== 'STARTED') {
      if (
        interaction.status === input.status &&
        (interaction.description ?? '') === (input.description ?? '')
      )
        return interaction
      throw new InteractionConflictError()
    }
    return this.repository.complete(input)
  }
}
