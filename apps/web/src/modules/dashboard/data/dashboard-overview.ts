import type {
  DashboardActivity,
  DashboardMetric,
  DashboardPipelineItem,
} from '../types/dashboard-overview'

export const dashboardMetrics: DashboardMetric[] = [
  { label: 'Imóveis ativos', value: '42', caption: '+8% no mês' },
  { label: 'Leads novos', value: '128', caption: '31 aguardando contato' },
  { label: 'Visitas marcadas', value: '18', caption: '7 nesta semana' },
  { label: 'Receita prevista', value: 'R$ 86k', caption: 'comissões em aberto' },
]

export const dashboardActivities: DashboardActivity[] = [
  {
    title: 'Proposta enviada',
    description: 'Cobertura Itaim Bibi recebeu contraproposta.',
    timestamp: 'Há 24 min',
  },
  {
    title: 'Visita confirmada',
    description: 'Apartamento Jardins 3q com João Silva.',
    timestamp: 'Há 1 hora',
  },
  {
    title: 'Novo lead',
    description: 'Maria entrou pelo marketplace buscando studio.',
    timestamp: 'Há 2 horas',
  },
]

export const dashboardPipeline: DashboardPipelineItem[] = [
  { label: 'Novo', value: '38' },
  { label: 'Em contato', value: '24' },
  { label: 'Visita', value: '18' },
  { label: 'Proposta', value: '9' },
]
