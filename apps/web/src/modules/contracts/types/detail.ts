import type { SxProps, Theme } from '@mui/material/styles'
import type { ReactNode } from 'react'
import type { ContractListItem } from './contract'
import type { ApiContractDocument, ApiContractParty } from './service'

export interface ContractDetailPanelProps {
  title: string
  children: ReactNode
  sx?: SxProps<Theme>
}
export interface ContractDetailHeaderProps {
  contract: ContractListItem
  readOnly: boolean
  canEdit: boolean
  canCancel: boolean
  canClose: boolean
  busy: boolean
  onEdit: () => void
  onCancel: () => void
  onClose: () => void
}
export interface ContractInfoPanelProps {
  contract: ContractListItem
}
export interface ContractDocumentsPanelProps {
  documents: ApiContractDocument[]
  dataRevision: number
  contractId: string
}
export interface ContractPartiesPanelProps {
  parties: ApiContractParty[]
  isSigning: boolean
  onSign: (partyId: string) => void
  readOnly: boolean
  canSign: boolean
  canLink: boolean
  onLink: (party: ApiContractParty) => void
}
