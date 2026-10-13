import { ForbiddenError } from '@server/shared/errors'

import type { Papel } from '@server/auth/domain/user.entity'

import { ChargeContractNotFoundError } from '../../domain/errors'
import type { Charge, ChargeType, NewChargeStatus } from '../../domain/charge.entity'
import type { ChargeRepository } from '../ports/charge-repository.port'

export interface CreateChargeInput {
  actorTenantId: string
  actorPapel: Papel
  contractId: string | null
  description: string | null
  type: ChargeType
  amount: number
  dueDate: Date
  status: NewChargeStatus
}

export class CreateChargeUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  async execute(input: CreateChargeInput): Promise<Charge> {
    if (input.actorPapel === 'RENTER') {
      throw new ForbiddenError('Locatários não podem gerenciar cobranças.')
    }

    if (input.contractId) {
      const contract = await this.chargeRepository.findContractSummary(
        input.actorTenantId,
        input.contractId,
      )

      if (!contract) {
        throw new ChargeContractNotFoundError()
      }
    }

    return this.chargeRepository.create({
      tenantId: input.actorTenantId,
      contractId: input.contractId,
      description: input.description,
      type: input.type,
      amount: input.amount,
      dueDate: input.dueDate,
      status: input.status,
    })
  }
}
