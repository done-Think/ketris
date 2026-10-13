import { ForbiddenError } from '@server/shared/errors'

import type { Papel } from '@server/auth/domain/user.entity'

import { ChargeNotFoundError } from '../../domain/errors'
import type { ChargeRepository } from '../ports/charge-repository.port'

export interface DeleteChargeInput {
  actorTenantId: string
  actorPapel: Papel
  chargeId: string
}

export class DeleteChargeUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  async execute(input: DeleteChargeInput): Promise<void> {
    if (input.actorPapel === 'RENTER') {
      throw new ForbiddenError('Locatários não podem gerenciar cobranças.')
    }

    const existing = await this.chargeRepository.findById(input.actorTenantId, input.chargeId)

    if (!existing) {
      throw new ChargeNotFoundError()
    }

    await this.chargeRepository.delete(input.actorTenantId, input.chargeId)
  }
}
