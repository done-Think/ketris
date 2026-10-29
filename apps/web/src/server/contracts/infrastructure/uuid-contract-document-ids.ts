import { randomUUID } from 'node:crypto'
import type { ContractDocumentIds } from '../application/ports/contract-document-storage.port'

export class UuidContractDocumentIds implements ContractDocumentIds {
  generate() {
    return randomUUID()
  }
}
