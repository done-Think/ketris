import { ForbiddenError } from '@server/shared/errors'

import type { Papel } from '@server/auth/domain/user.entity'

import { ChargeAlreadySettledError, ChargeNotFoundError } from '../../domain/errors'
import type { Charge } from '../../domain/charge.entity'
import type { ChargeRepository } from '../ports/charge-repository.port'

export interface RegisterChargePaymentInput {
  actorTenantId: string
  actorPapel: Papel
  chargeId: string
  paidAt: Date
  paymentMethod: string
  receiptUrl: string | null
}

export class RegisterChargePaymentUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  async execute(input: RegisterChargePaymentInput): Promise<Charge> {
    if (input.actorPapel === 'RENTER') {
      throw new ForbiddenError('Locatários não podem gerenciar cobranças.')
    }

    const existing = await this.chargeRepository.findById(input.actorTenantId, input.chargeId)

    if (!existing) {
      throw new ChargeNotFoundError()
    }

    if (existing.status === 'PAGA' || existing.status === 'CANCELADA') {
      throw new ChargeAlreadySettledError()
    }

    return this.chargeRepository.registerPayment(input.actorTenantId, input.chargeId, {
      paidAt: input.paidAt,
      paymentMethod: input.paymentMethod,
      receiptUrl: input.receiptUrl,
    })
  }
}
