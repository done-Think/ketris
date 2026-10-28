import type { ContractDocumentDescriptor } from '../../types/documents'

export const documentDescriptor: ContractDocumentDescriptor = {
  id: 'document',
  tenantId: 'agency',
  contractId: 'contract',
  actorId: 'manager',
  name: 'Contrato final.pdf',
  size: 512,
  sha256: 'd'.repeat(64),
  dataRevision: 2,
}

export const documentActor = {
  contractId: 'contract',
  actorId: 'manager',
  actorTenantId: 'agency',
  actorRole: 'OWNER',
} as const
