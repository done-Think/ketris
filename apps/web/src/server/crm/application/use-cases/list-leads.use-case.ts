import type { Papel } from '@server/auth/domain/user.entity'

import type { Lead } from '../../domain/lead.entity'
import type { LeadRepository } from '../ports/lead-repository.port'

export interface ListLeadsInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
}

export type ListLeadsOutput = Lead[]

export class ListLeadsUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}

  async execute(input: ListLeadsInput): Promise<ListLeadsOutput> {
    return this.leadRepository.findManyByTenant(input.actorTenantId, {
      responsavelId: input.actorPapel === 'AGENT' ? input.actorId : undefined,
    })
  }
}
