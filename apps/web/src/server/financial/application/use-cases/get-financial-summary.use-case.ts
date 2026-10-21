import { ForbiddenError } from '@server/shared/errors'

import type { Papel } from '@server/auth/domain/user.entity'

import type { FinancialSummary } from '../../domain/charge.entity'
import type { ChargeRepository } from '../ports/charge-repository.port'

export interface GetFinancialSummaryInput {
  actorTenantId: string
  actorPapel: Papel
}

export class GetFinancialSummaryUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  // The summary is the whole agency's revenue: only its owners and admins see it.
  async execute(input: GetFinancialSummaryInput): Promise<FinancialSummary> {
    if (input.actorPapel !== 'OWNER' && input.actorPapel !== 'ADMIN') {
      throw new ForbiddenError(
        'Apenas proprietários ou administradores podem ver o resumo financeiro da imobiliária.',
      )
    }

    return this.chargeRepository.getSummary(input.actorTenantId, new Date())
  }
}
