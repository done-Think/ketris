import type { ListLeadsInput, ListLeadsOutput } from '../../types/list-leads.use-case.types'
export type { ListLeadsInput, ListLeadsOutput } from '../../types/list-leads.use-case.types'

import { assertCrmAccess } from '../authorization'
import type { LeadRepository } from '../ports/lead-repository.port'

export class ListLeadsUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}

  async execute(input: ListLeadsInput): Promise<ListLeadsOutput> {
    assertCrmAccess(input.actorPapel)
    return this.leadRepository.findManyByTenant(input.actorTenantId, {
      ...input.filters,
      responsavelId: input.actorPapel === 'AGENT' ? input.actorId : undefined,
    })
  }
}
