import type { Papel } from '@server/auth/domain/user.entity'
import { ForbiddenError } from '@server/shared/errors'

import type { Lead } from '../../domain/lead.entity'
import type { LeadRepository } from '../ports/lead-repository.port'

export interface CreateLeadInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  name: string
  phone: string
  email?: string | null
  interest: string
  budget: string
  source: string
  notes?: string | null
}

export type CreateLeadOutput = Lead

export class CreateLeadUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}

  async execute(input: CreateLeadInput): Promise<CreateLeadOutput> {
    if (input.actorPapel === 'RENTER') {
      throw new ForbiddenError('Locatários não podem gerenciar leads.')
    }

    return this.leadRepository.create({
      tenantId: input.actorTenantId,
      responsavelId: input.actorId,
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
