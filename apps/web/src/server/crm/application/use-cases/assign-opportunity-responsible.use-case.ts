import { isAgencyManager } from '@server/auth/domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import { InvalidOpportunityResponsibleError, OpportunityNotFoundError } from '../../domain/errors'
import type {
  AssignOpportunityResponsibleInput,
  AssignOpportunityResponsibleOutput,
} from '../../types/assign-opportunity-responsible.use-case.types'
import { assertCrmAccess } from '../authorization'
import type { ActivityRepository } from '../ports/activity-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'
import type { ResponsibleLookupPort } from '../ports/responsible-lookup.port'

export class AssignOpportunityResponsibleUseCase {
  constructor(
    private readonly opportunityRepository: OpportunityRepository,
    private readonly responsibleLookup: ResponsibleLookupPort,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async execute(
    input: AssignOpportunityResponsibleInput,
  ): Promise<AssignOpportunityResponsibleOutput> {
    assertCrmAccess(input.actorRole)
    if (!isAgencyManager(input.actorRole))
      throw new ForbiddenError('Só o responsável pela imobiliária troca o responsável.')
    const current = await this.opportunityRepository.findById(input.opportunityId)
    if (!current || current.tenantId !== input.actorTenantId) throw new OpportunityNotFoundError()
    if (current.responsibleId === input.responsibleId) return current

    const name = await this.responsibleLookup.findActiveStaffName(
      input.actorTenantId,
      input.responsibleId,
    )
    if (!name) throw new InvalidOpportunityResponsibleError()

    const updated = await this.opportunityRepository.assignResponsible(
      current.id,
      input.responsibleId,
    )
    await this.activityRepository.create({
      opportunityId: current.id,
      type: 'NOTE',
      description: `${current.responsibleName} → ${name}`,
      systemAction: 'RESPONSIBLE_CHANGED',
      authorId: input.actorId,
      authorName: input.actorName ?? null,
      previousStatus: null,
      newStatus: null,
    })

    return updated
  }
}
