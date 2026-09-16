import type { Control } from 'react-hook-form'
import type { z } from 'zod'

import type { createLeadSchema } from '../schemas/create-lead-schema'

export type LeadStage = 'Novo' | 'Em contato' | 'Visita marcada' | 'Proposta'

export type LeadFilter = 'Todos' | LeadStage

export type LeadFilterKey = 'all' | 'new' | 'contacted' | 'visitScheduled' | 'proposal'

export type DashboardLead = {
  id: string
  name: string
  budget: string
  phone: string
  email: string
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

export type CreateLeadFormValues = z.infer<ReturnType<typeof createLeadSchema>>

export type CreateLeadStepKey = 'contact' | 'interest' | 'review'

export type CreateLeadStepLabelKey = CreateLeadStepKey

export type CreateLeadFieldName = keyof CreateLeadFormValues

export type CreateLeadStep = {
  key: CreateLeadStepKey
  labelKey: CreateLeadStepLabelKey
  fields: CreateLeadFieldName[]
}

export type LeadStageLabelKey = Exclude<LeadFilterKey, 'all'>

export type LeadSourceLabelKey = 'marketplace' | 'whatsApp' | 'instagram' | 'site' | 'referral'

export type LeadSourceOption = {
  value: string
  labelKey: LeadSourceLabelKey
}

export type LeadStageOption = {
  value: LeadStage
  labelKey: LeadStageLabelKey
}

export type LeadsStoreState = {
  leads: DashboardLead[]
  addLead: (values: CreateLeadFormValues, lastContactLabel: string) => DashboardLead
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
}

export type LeadsFilterBarProps = {
  activeFilter: LeadFilterKey
  leads: DashboardLead[]
  onFilterChange: (filter: LeadFilterKey) => void
}

export type LeadsListProps = {
  leads: DashboardLead[]
  onLeadContactSelect: (lead: DashboardLead) => void
  totalCount?: number
}
