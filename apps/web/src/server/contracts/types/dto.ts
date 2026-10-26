import type { z } from 'zod'
import type {
  editContractRequestSchema,
  contractHistoryResponseSchema,
  signContractPartyRequestSchema,
} from '../schemas/contract-workflow.schema'
import type {
  contractOpportunitiesResponseSchema,
  contractOpportunitySchema,
  listContractOpportunitiesQuerySchema,
} from '../schemas/contract-opportunity.schema'
import type {
  createContractRequestSchema,
  listContractsQuerySchema,
} from '../schemas/contract-input.schema'
import type {
  adjustmentIndexSchema,
  contractDocumentSchema,
  contractGuaranteeTypeSchema,
  contractListItemSchema,
  contractPartyRoleSchema,
  contractPartyUserLinkSchema,
  contractPartySchema,
  contractResponseSchema,
  contractSchema,
  contractStatusSchema,
  contractsResponseSchema,
  contractTypeSchema,
  signatureStatusSchema,
} from '../schemas/contract.schema'

export type CreateContractRequestDTO = z.infer<typeof createContractRequestSchema>
export type ListContractsQueryDTO = z.infer<typeof listContractsQuerySchema>
export type EditContractRequestDTO = z.infer<typeof editContractRequestSchema>
export type EditContractPayloadDTO = Omit<
  z.input<typeof editContractRequestSchema>,
  'startDate' | 'endDate'
> & { startDate: string; endDate: string }
export type ContractHistoryResponseDTO = z.infer<typeof contractHistoryResponseSchema>
export type SignContractPartyRequestDTO = z.infer<typeof signContractPartyRequestSchema>
export type ContractOpportunityDTO = z.infer<typeof contractOpportunitySchema>
export type ContractOpportunitiesResponseDTO = z.infer<typeof contractOpportunitiesResponseSchema>
export type ListContractOpportunitiesQueryDTO = z.infer<typeof listContractOpportunitiesQuerySchema>

export type ContractDTO = z.infer<typeof contractSchema>
export type ContractPartyDTO = z.infer<typeof contractPartySchema>
export type ContractDocumentDTO = z.infer<typeof contractDocumentSchema>
export type ContractListItemDTO = z.infer<typeof contractListItemSchema>
export type ContractResponseDTO = z.infer<typeof contractResponseSchema>
export type ContractsResponseDTO = z.infer<typeof contractsResponseSchema>
export type ContractStatusDTO = z.infer<typeof contractStatusSchema>
export type ContractTypeDTO = z.infer<typeof contractTypeSchema>
export type AdjustmentIndexDTO = z.infer<typeof adjustmentIndexSchema>
export type ContractGuaranteeTypeDTO = z.infer<typeof contractGuaranteeTypeSchema>
export type ContractPartyRoleDTO = z.infer<typeof contractPartyRoleSchema>
export type SignatureStatusDTO = z.infer<typeof signatureStatusSchema>
export type CreateContractPayloadDTO = Omit<
  z.input<typeof createContractRequestSchema>,
  'startDate' | 'endDate'
> & { startDate: string; endDate: string }

export type InitContractDocumentRequestDTO = z.infer<typeof initContractDocumentRequestSchema>
export type ConfirmContractDocumentRequestDTO = z.infer<typeof confirmContractDocumentRequestSchema>
export type ContractDocumentUploadResponseDTO = z.infer<typeof contractDocumentUploadResponseSchema>
export type ContractDocumentResponseDTO = z.infer<typeof contractDocumentResponseSchema>
export type ContractDocumentDownloadResponseDTO = z.infer<
  typeof contractDocumentDownloadResponseSchema
>

import type {
  initContractDocumentRequestSchema,
  confirmContractDocumentRequestSchema,
  contractDocumentUploadResponseSchema,
  contractDocumentResponseSchema,
  contractDocumentDownloadResponseSchema,
} from '../schemas/contract-document.schema'

export type ContractPartyUserLinkDTO = z.infer<typeof contractPartyUserLinkSchema>
