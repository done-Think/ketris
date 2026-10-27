import type { LeadSource, LeadSourceKey } from '@server/crm/constants/lead-sources'
import type {
  ConvertLeadRequestDTO,
  CreateLeadRequestDTO,
  LeadDTO,
  PatchLeadRequestDTO,
} from '@server/crm/types/dto'
import type { Control } from 'react-hook-form'
import type { z } from 'zod'

import type { createConvertLeadSchema } from '../schemas/convert-lead-schema'
import type { createLeadSchema } from '../schemas/create-lead-schema'

export type LeadStage = 'NOVO' | 'EM_CONTATO' | 'VISITA_MARCADA' | 'PROPOSTA'

export type LeadApiStage = 'NOVO' | 'EM_CONTATO' | 'VISITA_MARCADA' | 'PROPOSTA'

export type Lead = LeadDTO

export type CreateLeadPayload = CreateLeadRequestDTO

export type UpdateLeadStagePayload = Pick<PatchLeadRequestDTO, 'stage'>

export type ConvertLeadPayload = ConvertLeadRequestDTO

export type LeadFilter = 'ALL' | LeadStage

export type LeadTableSortField = 'name' | 'interest' | 'budget' | 'stage' | 'source' | 'lastContact'

export type LeadTableColumn = {
  key: 'name' | 'interest' | 'budget' | 'status' | 'source' | 'lastContact' | 'actions'
  sortField?: LeadTableSortField
}

export type LeadTableSortDirection = 'asc' | 'desc'

export type LeadTableSortState = {
  direction: LeadTableSortDirection
  field: LeadTableSortField
} | null

export type LeadFilterKey = 'all' | 'new' | 'contacted' | 'visitScheduled' | 'proposal'

export type LeadStageLabelKey = Exclude<LeadFilterKey, 'all'>

export type DashboardLead = {
  id: string
  name: string
  budget: string
  budgetAmount?: number
  phone: string
  email: string
  lastContact: string
  lastContactAt: string
  interest: string
  source: LeadSource
  broker: string
  stage: LeadStage
  opportunityId: string | null
}

export type LeadStageStyle = {
  bgcolor: string
  color: string
}

export type LeadStatusFilterOption = {
  labelKey: LeadFilterKey
  label: LeadFilter
}

export type LeadsDashboardFiltersFormValues = {
  activeFilter: LeadFilter
  searchQuery: string
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
  counts: Partial<Record<LeadFilter, number>>
  onFilterChange: (filter: LeadFilter) => void
}

export type LeadsCollectionActions = {
  onContactLead?: (lead: DashboardLead) => void
}

export type LeadsTableProps = LeadsCollectionActions & {
  leads: readonly DashboardLead[]
  onSortChange: (field: LeadTableSortField) => void
  sort: LeadTableSortState
}

export type LeadsCardsProps = LeadsCollectionActions & {
  leads: readonly DashboardLead[]
}

export type CreateLeadFormValues = z.infer<ReturnType<typeof createLeadSchema>>

export type CreateLeadStepKey = 'contact' | 'interest' | 'review'

export type CreateLeadStepLabelKey = CreateLeadStepKey

export type CreateLeadFieldName = keyof CreateLeadFormValues

export type CreateLeadStep = {
  key: CreateLeadStepKey
  labelKey: CreateLeadStepLabelKey
  fields: CreateLeadFieldName[]
}

export type LeadSourceLabelKey = LeadSourceKey

export type LeadSourceOption = {
  value: LeadSource
  labelKey: LeadSourceLabelKey
}

export type LeadStageOption = {
  value: LeadStage
  labelKey: LeadStageLabelKey
}

export type CreateLeadDialogProps = {
  onClose: () => void
  open: boolean
}

export type CreateLeadContactStepProps = {
  control: Control<CreateLeadFormValues>
}

export type CreateLeadInterestStepProps = {
  control: Control<CreateLeadFormValues>
}

export type CreateLeadReviewStepProps = {
  control: Control<CreateLeadFormValues>
  formValues: Partial<CreateLeadFormValues>
}

export type LeadContactDialogProps = {
  lead: DashboardLead | null
  onClose: () => void
  open: boolean
  onStageChange: (leadId: string, stage: LeadApiStage) => void
  onConvertRequest: (lead: DashboardLead) => void
}

export type ConvertLeadDialogProps = {
  lead: DashboardLead | null
  onClose: () => void
  open: boolean
}

export type ConvertLeadFormValues = z.infer<ReturnType<typeof createConvertLeadSchema>>

export type LeadsFilterBarProps = {
  activeFilter: LeadFilter
  leads: DashboardLead[]
  onFilterChange: (filter: LeadFilter) => void
}

export type LeadsListProps = {
  leads: readonly DashboardLead[]
  onLeadContactSelect: (lead: DashboardLead) => void
  totalCount?: number
}

export type LeadListFilters = import('@server/crm/types/dto').LeadListQueryDTO
