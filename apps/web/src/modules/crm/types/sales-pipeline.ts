import type { OpportunityCardProps } from './opportunity-card'
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

export type SalesPipelineBoardProps = {
  preview?: boolean
}

export type SalesPipelineToolbarProps = {
  search: string
  selectedStage: SalesPipelineStage | null | undefined
  selectedStageId: SalesPipelineStageId | null
  filterAnchor: HTMLElement | null
  onSearchChange: (search: string) => void
  onFilterOpen: (anchor: HTMLElement) => void
  onFilterClose: () => void
  onStageSelect: (stageId: SalesPipelineStageId | null) => void
  onNewOpportunity: () => void
}

export type PipelineStageColumnProps = {
  stage: SalesPipelineStage
  opportunities: readonly Opportunity[]
  projectedTotals: readonly SalesPipelineProjectedTotal[]
  isPipelineLoading: boolean
  hasPipelineError: boolean
  fixtureMode: boolean
  propertiesById: ReadonlyMap<string, PublicPropertySummary>
  presentationByOpportunityId: ReadonlyMap<string, OpportunityCardProps['presentation']>
}

export type SalesPipelinePreviewIndicator = {
  color: string
  label: string
}

export type SalesPipelineFixture = {
  stageId: SalesPipelineStageId
  opportunity: Opportunity
  property: PublicPropertySummary
  presentation: {
    indicatorColor: string
    indicatorLabel: string
    relativeDateLabel: string
  }
}

export type SalesPipelineFixtureInput = {
  slug: string
  stageId: SalesPipelineStageId
  name: string
  propertyTitle: string
  value: number
  daysAgo: number
  indicator: SalesPipelinePreviewIndicator
}
