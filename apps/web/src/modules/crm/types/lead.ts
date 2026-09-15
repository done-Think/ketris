export type LeadStage = 'Novo' | 'Em contato' | 'Visita marcada' | 'Proposta'

export type LeadFilter = 'Todos' | LeadStage

export type LeadFilterKey = 'all' | 'new' | 'contacted' | 'visitScheduled' | 'proposal'

export type DashboardLead = {
  id: string
  name: string
  budget: string
  lastContact: string
  interest: string
  source: string
  broker: string
  stage: LeadStage
}

export type LeadsPage = {
  items: readonly DashboardLead[]
  page: number
  pageCount: number
  totalCount: number
  firstItem: number
  lastItem: number
}

export type LeadStatusChipProps = {
  stage: LeadStage
}

export type LeadAvatarProps = {
  lead: DashboardLead
}

export type LeadsHeaderProps = {
  search: string
  onSearchChange: (search: string) => void
  onNewLead?: () => void
}

export type LeadsStatusFiltersProps = {
  activeFilter: LeadFilter
  leads: readonly DashboardLead[]
  onFilterChange: (filter: LeadFilter) => void
}

export type LeadsCollectionActions = {
  onContactLead?: (lead: DashboardLead) => void
}

export type LeadsTableProps = LeadsCollectionActions & {
  leads: readonly DashboardLead[]
}

export type LeadsCardsProps = LeadsTableProps

export type LeadsPaginationFooterProps = {
  firstVisible: number
  lastVisible: number
  resultTotal: number
  page: number
  canGoBack: boolean
  canGoForward: boolean
  onPageChange?: (page: number) => void
}
