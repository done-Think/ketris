import type { CreateLeadInput, CreateLeadOutput } from '../../types/create-lead.use-case.types'
export type { CreateLeadInput, CreateLeadOutput } from '../../types/create-lead.use-case.types'

import { assertCrmAccess } from '../authorization'
import type { LeadRepository } from '../ports/lead-repository.port'

export class CreateLeadUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}

  async execute(input: CreateLeadInput): Promise<CreateLeadOutput> {
    assertCrmAccess(input.actorRole)
    return this.leadRepository.create({
      tenantId: input.actorTenantId,
      responsibleId: input.actorId,
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      interest: input.interest,
      budget: input.budget,
      source: input.source,
      notes: input.notes ?? null,
    })
  }
}
