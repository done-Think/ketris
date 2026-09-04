export type LeadStage = 'Novo' | 'Em contato' | 'Visita marcada' | 'Proposta'

export type LeadFilterKey = 'Todos' | LeadStage

export type LeadStageLabelKey = 'new' | 'contacted' | 'visitScheduled' | 'proposal'

export type LeadFilterLabelKey = 'all' | LeadStageLabelKey

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
