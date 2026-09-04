import type {
  OwnerDashboardMetric,
  OwnerQuickAction,
  OwnerRecentProposal,
  OwnerUpcomingVisit,
  OwnerWeeklyPerformance,
} from '../types/owner-dashboard'

export const ownerDashboardMetrics: OwnerDashboardMetric[] = [
  {
    id: 'active-properties',
    label: 'Imóveis Ativos',
    value: '3',
    caption: 'De 4 cadastrados',
  },
  {
    id: 'pending-proposals',
    label: 'Propostas Pendentes',
    value: '7',
    badge: '7',
    caption: 'Aguardando resposta',
  },
  {
    id: 'weekly-visits',
    label: 'Visitas esta Semana',
    value: '4',
    caption: 'Próxima hoje às 14h',
  },
  {
    id: 'potential-revenue',
    label: 'Receita Potencial',
    value: 'R$ 18.600',
    trend: '+12%',
    caption: 'Aluguel total previsto',
  },
]

export const ownerRecentProposals: OwnerRecentProposal[] = [
  {
    id: 'proposal-mariana-costa',
    property: 'Ap Jardins',
    proponent: 'Mariana Costa',
    value: 'R$ 4.500/mês',
    date: 'Hoje',
    status: 'new',
  },
  {
    id: 'proposal-bruno-guedes',
    property: 'Studio Pinheiros',
    proponent: 'Bruno Guedes',
    value: 'R$ 3.200/mês',
    date: 'Hoje',
    status: 'new',
  },
  {
    id: 'proposal-carla-souza',
    property: 'Ap Jardins',
    proponent: 'Carla Souza',
    value: 'R$ 4.700/mês',
    date: 'Ontem',
    status: 'new',
  },
  {
    id: 'proposal-felipe-melo',
    property: 'Duplex Alto Lapa',
    proponent: 'Felipe Melo',
    value: 'R$ 8.900/mês',
    date: '14 Jul',
    status: 'accepted',
  },
]

export const ownerUpcomingVisits: OwnerUpcomingVisit[] = [
  {
    id: 'visit-apartment-jardins',
    date: 'Hoje',
    time: '14:00',
    property: 'Apartamento Jardins',
    visitor: 'Lucas Rocha',
    status: 'Confirmada',
  },
  {
    id: 'visit-studio-pinheiros',
    date: 'Amanhã',
    time: '10:30',
    property: 'Studio Loft Pinheiros',
    visitor: 'Clara Nunes',
    status: 'Confirmada',
  },
  {
    id: 'visit-casa-campo-belo',
    date: '18 Jul',
    time: '16:00',
    property: 'Casa Campo Belo',
    visitor: 'Renato Silva',
    status: 'Confirmada',
  },
]

export const ownerWeeklyPerformance: OwnerWeeklyPerformance = {
  value: '+15% views',
  caption: 'Tendência de alta',
  points: [6, 9, 7, 13, 10, 17, 14, 21, 18, 24],
}

export const ownerQuickActions: OwnerQuickAction[] = [
  { id: 'list-property', label: 'Anunciar Imóvel', href: '/dashboard/imoveis/novo' },
  { id: 'generate-report', label: 'Gerar Relatório', href: '/dashboard/financeiro' },
  { id: 'configure-alerts', label: 'Configurar Alertas', href: '/dashboard/agenda' },
  { id: 'support', label: 'Suporte Ketris', href: 'mailto:suporte@ketris.com.br' },
]
