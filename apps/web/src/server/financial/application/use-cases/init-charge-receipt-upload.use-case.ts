import { CHARGE_RECEIPT_UPLOAD_TTL_SECONDS } from '../../config/receipt-limits'
import { chargeReceiptObjectKey } from '../../domain/charge-receipt'
import { assertCanSettleCharge } from '../../domain/charge-workflow'
import { ChargeNotFoundError } from '../../domain/errors'
import type { InitChargeReceiptUploadInput } from '../../types/use-case-inputs'
import { assertCanAccessFinance } from '../assert-can-access-finance'
import type { ChargeRepository } from '../ports/charge-repository.port'
import type {
  ChargeReceiptIds,
  ChargeReceiptStorage,
  ChargeReceiptUploadTickets,
} from '../ports/charge-receipt-storage.port'

export class InitChargeReceiptUploadUseCase {
  constructor(
    private readonly chargeRepository: ChargeRepository,
    private readonly storage: ChargeReceiptStorage,
    private readonly tickets: ChargeReceiptUploadTickets,
    private readonly ids: ChargeReceiptIds,
  ) {}

  async execute(input: InitChargeReceiptUploadInput) {
    assertCanAccessFinance(input.actorRole)

    const charge = await this.chargeRepository.findById(input.actorTenantId, input.chargeId)
    if (!charge) throw new ChargeNotFoundError()
    assertCanSettleCharge(charge)

    const descriptor = {
      id: this.ids.generate(),
      tenantId: charge.tenantId,
      chargeId: charge.id,
      actorId: input.actorId,
      name: input.name,
      contentType: input.contentType,
      size: input.size,
      sha256: input.sha256,
    }
    const location = await this.storage.uploadLocation(
      chargeReceiptObjectKey(descriptor),
      descriptor,
    )

    return {
      uploadUrl: location.url,
      headers: location.headers,
      uploadToken: await this.tickets.issue(descriptor),
      expiresAt: new Date(Date.now() + CHARGE_RECEIPT_UPLOAD_TTL_SECONDS * 1000),
    }
  }
}
