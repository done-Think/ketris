import type { CreateContractPayloadDTO } from '@server/contracts/types/dto'

export type {
  AdjustmentIndexDTO as ApiAdjustmentIndex,
  ContractDocumentDTO as ApiContractDocument,
  ContractDTO as ApiContract,
  ContractGuaranteeTypeDTO as ApiContractGuaranteeType,
  ContractListItemDTO as ApiContractListItem,
  ContractPartyDTO as ApiContractParty,
  ContractPartyUserLinkDTO as ContractPartyUserLink,
  ContractPartyRoleDTO as ApiContractPartyRole,
  ContractResponseDTO as ContractResponse,
  ContractStatusDTO as ApiContractStatus,
  ContractsResponseDTO as ListContractsResponse,
  ContractTypeDTO as ApiContractType,
  CreateContractPayloadDTO as CreateContractPayload,
  ListContractsQueryDTO as ContractListFilters,
  SignatureStatusDTO as ApiSignatureStatus,
  EditContractPayloadDTO as EditContractPayload,
  ContractHistoryResponseDTO as ContractHistoryPage,
  ContractOpportunityDTO as ContractOpportunity,
  ContractOpportunitiesResponseDTO as ContractOpportunitiesPage,
  ListContractOpportunitiesQueryDTO as ContractOpportunityFilters,
  SignContractPartyRequestDTO as SignContractPartyPayload,
  InitContractDocumentRequestDTO as InitContractDocumentPayload,
  ContractDocumentUploadResponseDTO as ContractDocumentUploadAuthorization,
  ContractDocumentResponseDTO as ContractDocumentResponse,
  ContractDocumentDownloadResponseDTO as ContractDocumentDownload,
} from '@server/contracts/types/dto'

export type ContractPartyInput = CreateContractPayloadDTO['owner']
