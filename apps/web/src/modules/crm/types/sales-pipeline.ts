import type { Opportunity, OpportunityStatus } from './opportunity'
import type { PublicPropertySummary } from './property'

export type SalesPipelineStageId =
  'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed'

export type SalesPipelineStage = {
  id: SalesPipelineStageId
  label: string
  labelKey: string
  statuses: readonly OpportunityStatus[]
  color: string
  softColor: string
}

export type SalesPipelineProjectedTotal = {
  label: string
  labelKey: 'rent' | 'sale' | 'uncategorized'
  value: string
}

export type SalesPipelineViewMode = 'kanban' | 'list'

export type SalesPipelineToolbarProps = {
  search: string
  selectedStage: SalesPipelineStage | null | undefined
  selectedStageId: SalesPipelineStageId | null
  filterAnchor: HTMLElement | null
  viewMode: SalesPipelineViewMode
  onSearchChange: (search: string) => void
  onFilterOpen: (anchor: HTMLElement) => void
  onFilterClose: () => void
  onStageSelect: (stageId: SalesPipelineStageId | null) => void
  onNewOpportunity: () => void
  onViewModeChange: (viewMode: SalesPipelineViewMode) => void
}

export type PipelineStageColumnProps = {
  stage: SalesPipelineStage
  opportunities: readonly Opportunity[]
  projectedTotals: readonly SalesPipelineProjectedTotal[]
  isPipelineLoading: boolean
  hasPipelineError: boolean
  propertiesById: ReadonlyMap<string, PublicPropertySummary>
}
