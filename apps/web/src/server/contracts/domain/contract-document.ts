import type { ContractDocumentDescriptor } from '../types/documents'

export function contractDocumentObjectKey(
  descriptor: Pick<ContractDocumentDescriptor, 'tenantId' | 'contractId' | 'id'>,
) {
  return (
    'contracts/' + descriptor.tenantId + '/' + descriptor.contractId + '/' + descriptor.id + '.pdf'
  )
}
