import type { MouseEvent } from 'react'

import type { Opportunity, OpportunityEditFormValues, OpportunityStatus } from './opportunity'
import type { PublicPropertyDetail } from './property'

export type OpportunityDetailProps = {
  opportunityId: string
}

export type OpportunityActivity = {
  key: string
  title: string
  detail: string
  occurredAt: string
}

export type DetailItemProps = {
  label: string
  value: string
}

export type OpportunityStagePresentation = {
  status: OpportunityStatus
  label: string
  color: string
  softColor: string
}

export type OpportunityDetailHeaderProps = {
  opportunity: Opportunity
  stage: OpportunityStagePresentation
  property?: PublicPropertyDetail
}

export type OpportunityContactPanelProps = {
  opportunity: Opportunity
}

export type OpportunityPropertyPanelProps = {
  opportunity: Opportunity
  property?: PublicPropertyDetail
  propertyLocation: string
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

export type OpportunityActivitiesPanelProps = {
  activities: OpportunityActivity[]
}

export type OpportunityActionsFooterProps = {
  opportunity: Opportunity
  isMutating: boolean
  onStageMenuOpen: (event: MouseEvent<HTMLButtonElement>) => void
  onDiscardLead: () => void
  onEdit: () => void
  onArchive: () => void
}

export type OpportunityStageMenuProps = {
  anchorEl: HTMLElement | null
  opportunity: Opportunity
  onClose: () => void
  onRequestStatusChange: (status: OpportunityStatus) => void
}

export type StatusChangeDialogProps = {
  nextStatus: OpportunityStatus | null
  opportunity: Opportunity
  stage: OpportunityStagePresentation
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}

export type EditOpportunityDialogProps = {
  open: boolean
  initialValues: OpportunityEditFormValues | null
  isPending: boolean
  onClose: () => void
  onSave: (values: OpportunityEditFormValues) => void | Promise<void>
}

export type ArchiveOpportunityDialogProps = {
  open: boolean
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}

export type OpportunityInterestDetails = {
  interest: string
  budget: string
  deadline: string
}

export type SuggestedPropertyPresentation = {
  id: string
  title: string
  imageUrl?: string
  meta: string
  priceLabel: string
  matchPercentage?: number
  href?: string
}

export type OpportunityActivityKind = 'phone' | 'email' | 'opportunity'

export type OpportunityActivityPresentation = {
  id: string
  kind: OpportunityActivityKind
  title: string
  dateLabel: string
  description: string
}

export type OpportunityNextActionKind = 'visit' | 'followUp'

export type OpportunityNextActionPresentation = {
  id: string
  kind: OpportunityNextActionKind
  title: string
  scheduleLabel: string
}

export type OpportunityDetailStagePresentation = {
  label: string
  color: string
  softColor: string
}

export type OpportunityDetailPresentation = {
  interestDetails: OpportunityInterestDetails
  suggestedProperties: readonly SuggestedPropertyPresentation[]
  activities: readonly OpportunityActivityPresentation[]
  nextActions: readonly OpportunityNextActionPresentation[]
}

export type OpportunityDetailFixture = {
  opportunity: Opportunity
  stage: OpportunityDetailStagePresentation
  presentation: OpportunityDetailPresentation
}
