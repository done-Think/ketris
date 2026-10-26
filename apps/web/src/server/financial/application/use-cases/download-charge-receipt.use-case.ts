import { isAgencyManager } from '@server/auth/domain/roles'

import { CHARGE_RECEIPT_DOWNLOAD_TTL_SECONDS } from '../../config/receipt-limits'
import { chargeReceiptObjectKey } from '../../domain/charge-receipt'
import { ChargeReceiptInvalidError, ChargeReceiptNotFoundError } from '../../domain/errors'
import type { DownloadChargeReceiptInput } from '../../types/use-case-inputs'
import { resolveChargeReadScope } from '../charge-read-scope'
import type { ChargeRepository } from '../ports/charge-repository.port'
import type { ChargeReceiptStorage } from '../ports/charge-receipt-storage.port'

export class DownloadChargeReceiptUseCase {
  constructor(
    private readonly chargeRepository: ChargeRepository,
    private readonly storage: ChargeReceiptStorage,
  ) {}

  async execute(input: DownloadChargeReceiptInput) {
    const scope = resolveChargeReadScope(input)
    const receipt = await this.chargeRepository.findReceipt(
      scope,
      input.chargeId,
      input.receiptId,
      isAgencyManager(input.actorPapel),
    )
    if (!receipt) throw new ChargeReceiptNotFoundError()
    if (receipt.objectKey !== chargeReceiptObjectKey(receipt))
      throw new ChargeReceiptNotFoundError()

    const info = await this.storage.inspect(receipt.objectKey)
    if (info.sha256 !== receipt.sha256 || info.size !== receipt.size) {
      throw new ChargeReceiptInvalidError()
    }

    return {
      url: await this.storage.downloadUrl(receipt.objectKey, receipt.name, receipt.contentType),
      expiresAt: new Date(Date.now() + CHARGE_RECEIPT_DOWNLOAD_TTL_SECONDS * 1000),
    }
  }
}
