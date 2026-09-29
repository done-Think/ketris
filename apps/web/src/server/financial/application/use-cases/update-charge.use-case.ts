import { ForbiddenError } from '@server/shared/errors'

import type { Papel } from '@server/auth/domain/user.entity'

import { ChargeNotFoundError } from '../../domain/errors'
import type { Charge, ChargeStatus, ChargeType } from '../../domain/charge.entity'
import type { ChargeRepository } from '../ports/charge-repository.port'

export interface UpdateChargeInput {
  actorTenantId: string
  actorPapel: Papel
  chargeId: string
  description: string | null
  type: ChargeType
  amount: number
  dueDate: Date
  status: ChargeStatus
}

export class UpdateChargeUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  async execute(input: UpdateChargeInput): Promise<Charge> {
    if (input.actorPapel === 'RENTER') {
      throw new ForbiddenError('Locatários não podem gerenciar cobranças.')
    }

    const existing = await this.chargeRepository.findById(input.actorTenantId, input.chargeId)

    if (!existing) {
      throw new ChargeNotFoundError()
    }

    const hasRegisteredPayment = existing.paidAt !== null
    // Status only becomes PAGA through the dedicated "register payment" flow, never via edit.
    const finalStatus =
      input.status === 'PAGA' && !hasRegisteredPayment ? existing.status : input.status
    const keepsPayment = finalStatus === 'PAGA'

    return this.chargeRepository.update(input.actorTenantId, input.chargeId, {
      description: input.description,
      type: input.type,
      amount: input.amount,
      dueDate: input.dueDate,
      status: finalStatus,
      paymentMethod: keepsPayment ? existing.paymentMethod : null,
      receiptUrl: keepsPayment ? existing.receiptUrl : null,
      paidAt: keepsPayment ? existing.paidAt : null,
    })
  }
}
