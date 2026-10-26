import { useMutation } from '@tanstack/react-query'
import { contractDocumentsService } from '../services/contract-documents-service'
import { useInvalidateContracts } from './use-invalidate-contracts'

export function useUploadContractDocument(
  tenantId: string,
  contractId: string,
  onProgress: (percent: number) => void,
) {
  const invalidate = useInvalidateContracts(tenantId)
  return useMutation({
    mutationFn: (file: File) => contractDocumentsService.upload(contractId, file, onProgress),
    onSuccess: invalidate,
  })
}

export function useDownloadContractDocument(contractId: string) {
  return useMutation({
    mutationFn: (documentId: string) => contractDocumentsService.download(contractId, documentId),
  })
}
