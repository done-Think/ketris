export type ProposalManagementStatus = 'IN_NEGOTIATION' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'DRAFT'

export type ProposalManagementFilterId = 'all' | ProposalManagementStatus

export type ProposalTransactionKind = 'rent' | 'sale'

export type ProposalManagementStatusPresentation = {
  color: string
  backgroundColor: string
}

export type ProposalManagementStatusFilter = {
  id: ProposalManagementFilterId
}

export type ProposalManagementPerson = {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

export type ProposalManagementProperty = {
  id: string
  title: string
  address: string
  thumbnailUrl?: string
}

export type ProposalManagementListItem = {
  id: string
  reference: string
  lead: ProposalManagementPerson
  property: ProposalManagementProperty
  amount: number
  transactionKind: ProposalTransactionKind
  valueLabel: string
  status: ProposalManagementStatus
  createdAt: string
  createdLabel: string
}

export type ProposalManagementStatusCounts = Readonly<Record<ProposalManagementStatus, number>>

export type ProposalManagementSummary = {
  totalCount: number
  statusCounts: ProposalManagementStatusCounts
  negotiationCount: number
  acceptedTotalAmount: number
  acceptedTotalLabel: string
  conversionRate: number
  conversionRateLabel: string
}

export type ProposalManagementPage = {
  items: readonly ProposalManagementListItem[]
  page: number
  pageSize: number
  pageCount: number
  totalCount: number
  firstItem: number
  lastItem: number
}

export type ProposalStatusChipProps = {
  status: ProposalManagementStatus
}

export type ProposalStatusFiltersProps = {
  activeStatus: ProposalManagementFilterId
  summary: ProposalManagementSummary
  onStatusChange: (status: ProposalManagementFilterId) => void
}

export type ProposalKpiCardsProps = {
  summary: ProposalManagementSummary
}

export type ProposalCollectionActions = {
  onViewProposal?: (proposal: ProposalManagementListItem) => void
  onOpenMoreOptions?: (proposal: ProposalManagementListItem) => void
}

export type ProposalActionsProps = ProposalCollectionActions & {
  proposal: ProposalManagementListItem
}

export type ProposalsTableProps = ProposalCollectionActions & {
  proposals: readonly ProposalManagementListItem[]
}

export type ProposalMobileCardsProps = ProposalsTableProps

export type ProposalFixtureInput = {
  sequence: number
  leadName: string
  leadEmail: string
  propertyTitle: string
  propertyAddress: string
  amount: number
  transactionKind: ProposalTransactionKind
  status: ProposalManagementStatus
  createdAt: string
  createdLabel: string
}

export interface CrmProposalsListProps {
  embedded?: boolean
  search: string
  header?: import('react').ReactNode
}
