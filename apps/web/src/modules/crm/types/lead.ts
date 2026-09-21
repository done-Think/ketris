import type { Control } from 'react-hook-form'
import type { z } from 'zod'

import type { createLeadSchema } from '../schemas/create-lead-schema'

export type LeadStage = 'Novo' | 'Em contato' | 'Visita marcada' | 'Proposta'

export type LeadApiStage = 'NOVO' | 'EM_CONTATO' | 'VISITA_MARCADA' | 'PROPOSTA'

export interface Lead {
  id: string
  tenantId: string
  responsavelId: string
  name: string
  phone: string
  email: string | null
  interest: string
  budget: string
  source: string
  stage: LeadApiStage
  notes: string | null
  opportunityId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateLeadPayload {
  name: string
  phone: string
  email?: string | null
  interest: string
  budget: string
  source: string
  notes?: string | null
}

export interface UpdateLeadStagePayload {
  stage: LeadApiStage
}

export interface ConvertLeadPayload {
  propertyId: string
  proposedValue: number
}

export type LeadFilter = 'Todos' | LeadStage

export type LeadFilterKey = 'all' | 'new' | 'contacted' | 'visitScheduled' | 'proposal'

export type LeadStageLabelKey = Exclude<LeadFilterKey, 'all'>

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
  pageCount: number
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

export type LeadSourceLabelKey = 'marketplace' | 'whatsApp' | 'instagram' | 'site' | 'referral'

export type LeadSourceOption = {
  value: string
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
