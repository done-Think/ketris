import type {
  StartContactInteractionInput,
  StartContactInteractionOutput,
} from '../../types/start-contact-interaction.use-case.types'
export type {
  StartContactInteractionInput,
  StartContactInteractionOutput,
} from '../../types/start-contact-interaction.use-case.types'

import {
  ContactNotFoundError,
  InteractionChannelUnavailableError,
  InteractionConflictError,
} from '../../domain/errors'
import type { CrmUseCase } from '../../types/prisma'
import type { GetContactInput, GetContactOutput } from '../../types/get-contact.use-case.types'
import { assertCrmAccess } from '../authorization'
import type { InteractionRepository } from '../ports/interaction-repository.port'

export class StartContactInteractionUseCase {
  constructor(
    private readonly repository: InteractionRepository,
    private readonly getContact: CrmUseCase<GetContactInput, GetContactOutput>,
  ) {}

  async execute(input: StartContactInteractionInput): Promise<StartContactInteractionOutput> {
    assertCrmAccess(input.actorRole)
    const contact = await this.getContact.execute(input)
    if (contact.tenantId !== input.actorTenantId || contact.archivedAt)
      throw new ContactNotFoundError()
    if (input.channel === 'EMAIL' ? !contact.email : !contact.phone?.replace(/\D/g, ''))
      throw new InteractionChannelUnavailableError()
    const existing = await this.repository.findByRequestId(input.requestId)
    if (existing) {
      if (
        existing.leadId ||
        existing.contactId !== input.contactId ||
        existing.actorUserId !== input.actorId ||
        existing.channel !== input.channel
      )
        throw new InteractionConflictError()
      return existing
    }
    return this.repository.start(input)
  }
}
