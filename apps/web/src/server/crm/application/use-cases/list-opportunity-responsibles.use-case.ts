import { isAgencyManager } from '@server/auth/domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import type {
  ListOpportunityResponsiblesInput,
  OpportunityResponsible,
} from '../../types/opportunity-responsible'
import { assertCrmAccess } from '../authorization'
import type { ResponsibleLookupPort } from '../ports/responsible-lookup.port'

export class ListOpportunityResponsiblesUseCase {
  constructor(private readonly responsibleLookup: ResponsibleLookupPort) {}

  async execute(input: ListOpportunityResponsiblesInput): Promise<OpportunityResponsible[]> {
    assertCrmAccess(input.actorRole)
    if (!isAgencyManager(input.actorRole))
      throw new ForbiddenError('Só o responsável pela imobiliária escolhe responsáveis.')

    return this.responsibleLookup.listActiveStaff(input.actorTenantId)
  }
}
