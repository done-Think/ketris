import type { MouseEvent } from 'react'

import type {
  CreateOpportunityFormValues,
  Opportunity,
  OpportunityEditFormValues,
  OpportunityStatus,
} from './opportunity'
import type { OpportunityStage } from './opportunity-stage'
import type { CrmPropertyDetail, CrmPropertySummary } from './property'

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

export type OpportunityStagePresentation = OpportunityStage

export type OpportunityDetailHeaderProps = {
  opportunity: Opportunity
  stage: OpportunityStagePresentation
}

export type OpportunityContactPanelProps = {
  opportunity: Opportunity
}

export type OpportunityPropertyPanelProps = {
  opportunity: Opportunity
  property?: CrmPropertyDetail
  propertyLocation: string
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

export type OpportunityActivitiesPanelProps = {
  isLoading?: boolean
  activities: OpportunityActivity[]
}

export type OpportunityNextAction = {
  key: string
  title: string
  detail: string
  tone: 'info' | 'warning' | 'success'
}

export type OpportunityNextActionItemProps = {
  action: OpportunityNextAction
  expanded: boolean
  onToggle: () => void
}

export type OpportunityNextActionsPanelProps = {
  actions: OpportunityNextAction[]
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

export type CreateOpportunityDialogProps = {
  open: boolean
  tenantId: string
  canChooseResponsible: boolean
  isPending: boolean
  onClose: () => void
  onSave: (values: CreateOpportunityFormValues) => void
}

export type PropertyAutocompleteProps = {
  tenantId: string
  value: CrmPropertySummary | null
  onChange: (property: CrmPropertySummary | null) => void
  error?: boolean
  helperText?: string
}

export type OpportunityResponsiblePanelProps = {
  opportunity: Opportunity
  tenantId: string
  canManage: boolean
}
