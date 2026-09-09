import type { z } from 'zod'

import type { createLeadSchema } from '../schemas/create-lead-schema'

export type LeadStage = 'Novo' | 'Em contato' | 'Visita marcada' | 'Proposta'

export type LeadFilterKey = 'Todos' | LeadStage

export type LeadStageLabelKey = 'new' | 'contacted' | 'visitScheduled' | 'proposal'

export type LeadFilterLabelKey = 'all' | LeadStageLabelKey

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

export type LeadStageStyle = {
  bgcolor: string
  color: string
}

export type LeadStatusFilterOption = {
  labelKey: LeadFilterLabelKey
  label: LeadFilterKey
}

export type LeadsDashboardFiltersFormValues = {
  activeFilter: LeadFilterKey
  searchQuery: string
}

export type LeadStatusChipProps = {
  stage: LeadStage
}

export type CreateLeadFormValues = z.infer<typeof createLeadSchema>

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

export type LeadsStoreState = {
  leads: DashboardLead[]
  addLead: (values: CreateLeadFormValues, lastContactLabel: string) => DashboardLead
}

export type CreateLeadDialogProps = {
  onClose: () => void
  open: boolean
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
