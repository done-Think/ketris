export type LeadStage = 'Novo' | 'Em contato' | 'Visita marcada' | 'Proposta'

export type DashboardLead = {
  id: string
  name: string
  lastContact: string
  interest: string
  source: string
  broker: string
  stage: LeadStage
}
