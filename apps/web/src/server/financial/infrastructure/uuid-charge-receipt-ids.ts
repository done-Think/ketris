import { randomUUID } from 'node:crypto'

import type { ChargeReceiptIds } from '../application/ports/charge-receipt-storage.port'

export class UuidChargeReceiptIds implements ChargeReceiptIds {
  generate(): string {
    return randomUUID()
  }
}
