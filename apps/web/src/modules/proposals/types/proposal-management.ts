export type ProposalManagementStatus =
  'EM_NEGOCIACAO' | 'ENVIADA' | 'ACEITA' | 'RECUSADA' | 'RASCUNHO'

export type ProposalManagementFilterId = 'all' | ProposalManagementStatus

export type ProposalTransactionKind = 'rent' | 'sale'

export type ProposalManagementStatusPresentation = {
  label: string
  color: string
  backgroundColor: string
}

export type ProposalManagementStatusFilter = {
  id: ProposalManagementFilterId
  label: string
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

export type ProposalManagementHistoryEntry = {
  id: string
  title: string
  description: string
  dateLabel: string
  isCurrent: boolean
}

export type ProposalManagementDetail = {
  proposal: ProposalManagementListItem
  contractTermMonths: number | null
  contractTermLabel: string
  intendedStartDate: string
  intendedStartDateLabel: string
  guaranteeLabel: string
  observations: string
  specialConditions: readonly string[]
  broker: ProposalManagementPerson
  history: readonly ProposalManagementHistoryEntry[]
}

export type ProposalManagementQuery = {
  search?: string
  status?: ProposalManagementFilterId
  page?: number
  pageSize?: number
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

export type ProposalsListProps = {
  proposals?: readonly ProposalManagementListItem[]
  summary?: ProposalManagementSummary
  initialPage?: number
  pageSize?: number
  onNewProposal?: () => void
  onViewProposal?: (proposal: ProposalManagementListItem) => void
  onOpenMoreOptions?: (proposal: ProposalManagementListItem) => void
  onPageChange?: (page: number) => void
}

export type ProposalDetailProps = {
  proposalId: string
  onEdit?: (detail: ProposalManagementDetail) => void
  onSendToOwner?: (detail: ProposalManagementDetail) => void
}

export type CrmProposalDetailPageProps = {
  params: { id: string }
}

export type ProposalStatusChipProps = {
  status: ProposalManagementStatus
}

export type ProposalListHeaderProps = {
  search: string
  onSearchChange: (search: string) => void
  onNewProposal?: () => void
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

export type ProposalPaginationProps = {
  page: number
  pageCount: number
  visibleCount: number
  totalCount: number
  onPageChange?: (page: number) => void
}

export type ProposalDetailHeaderProps = {
  detail: ProposalManagementDetail
  onEdit?: (detail: ProposalManagementDetail) => void
  onSendToOwner?: (detail: ProposalManagementDetail) => void
}

export type ProposalInformationPanelProps = {
  detail: ProposalManagementDetail
}

export type ProposalSpecialConditionsPanelProps = {
  conditions: readonly string[]
}

export type ProposalBindingPanelProps = {
  lead: ProposalManagementPerson
  property: ProposalManagementProperty
  broker: ProposalManagementPerson
}

export type ProposalHistoryPanelProps = {
  entries: readonly ProposalManagementHistoryEntry[]
}
