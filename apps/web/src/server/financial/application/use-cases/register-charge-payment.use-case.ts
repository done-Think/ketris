import { ForbiddenError } from '@server/shared/errors'
import { calendarDateInTimeZone } from '@server/shared/time-zone-calendar'

import { chargeReceiptObjectKey, matchesReceiptSignature } from '../../domain/charge-receipt'
import { withEffectiveStatus } from '../../domain/charge-status'
import { assertCanSettleCharge } from '../../domain/charge-workflow'
import { ChargeNotFoundError, ChargeReceiptInvalidError } from '../../domain/errors'
import type { Charge, NewChargeReceipt } from '../../types/charge-entity'
import type { RegisterChargePaymentInput } from '../../types/use-case-inputs'
import { assertCanAccessFinance } from '../assert-can-access-finance'
import type { ChargeRepository } from '../ports/charge-repository.port'
import type {
  ChargeReceiptStorage,
  ChargeReceiptUploadTickets,
} from '../ports/charge-receipt-storage.port'

export class RegisterChargePaymentUseCase {
  constructor(
    private readonly chargeRepository: ChargeRepository,
    private readonly storage: ChargeReceiptStorage,
    private readonly tickets: ChargeReceiptUploadTickets,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: RegisterChargePaymentInput): Promise<Charge> {
    assertCanAccessFinance(input.actorPapel)

    const current = await this.chargeRepository.findById(input.actorTenantId, input.chargeId)
    if (!current) throw new ChargeNotFoundError()
    assertCanSettleCharge(current)

    const receipt = input.receiptUploadToken
      ? await this.verifiedReceipt(input, input.receiptUploadToken)
      : null

    const paid = await this.chargeRepository.registerPayment(
      current,
      { paidAt: input.paidAt, paymentMethod: input.paymentMethod, receipt },
      { tenantId: input.actorTenantId, actorId: input.actorId },
    )

    return withEffectiveStatus(paid, calendarDateInTimeZone(this.now()))
  }

  private async verifiedReceipt(
    input: RegisterChargePaymentInput,
    token: string,
  ): Promise<NewChargeReceipt> {
    const descriptor = await this.tickets.verify(token)
    if (
      descriptor.actorId !== input.actorId ||
      descriptor.tenantId !== input.actorTenantId ||
      descriptor.chargeId !== input.chargeId
    ) {
      throw new ForbiddenError('A autorização de envio não corresponde à cobrança e ao usuário.')
    }

    const objectKey = chargeReceiptObjectKey(descriptor)
    const info = await this.storage.inspect(objectKey)
    if (
      info.size !== descriptor.size ||
      info.sha256 !== descriptor.sha256 ||
      info.contentType !== descriptor.contentType ||
      !matchesReceiptSignature(descriptor.contentType, info.signature)
    ) {
      throw new ChargeReceiptInvalidError()
    }

    return {
      id: descriptor.id,
      objectKey,
      name: descriptor.name,
      contentType: descriptor.contentType,
      size: descriptor.size,
      sha256: descriptor.sha256,
    }
  }
}
