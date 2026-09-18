import type { BrokerTeamKpi, BrokerTeamMember } from '../types/broker-team'

export const brokerTeamMembers: readonly BrokerTeamMember[] = [
  {
    id: 'marina-souza',
    profileId: 'marina-costa',
    name: 'Marina Souza',
    role: 'Corretora senior',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
    properties: 42,
    leads: 18,
    monthlySales: 14,
    returns: 21,
    goalProgress: 95,
    status: 'ahead',
    specialty: 'Alto padrao',
    responseTime: '12 min',
  },
  {
    id: 'thiago-lopes',
    profileId: 'thiago-santos',
    name: 'Thiago Lopes',
    role: 'Corretor senior',
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    properties: 38,
    leads: 15,
    monthlySales: 11,
    returns: 17,
    goalProgress: 85,
    status: 'onTrack',
    specialty: 'Locacao corporate',
    responseTime: '18 min',
  },
  {
    id: 'ana-costa',
    profileId: 'juliana-mendes',
    name: 'Ana Costa',
    role: 'Corretora senior',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    properties: 31,
    leads: 10,
    monthlySales: 9,
    returns: 14,
    goalProgress: 78,
    status: 'onTrack',
    specialty: 'Familia e bairros nobres',
    responseTime: '22 min',
  },
  {
    id: 'lucas-ramos',
    profileId: 'renato-alves',
    name: 'Lucas Ramos',
    role: 'Corretor senior',
    avatarUrl:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80',
    properties: 28,
    leads: 12,
    monthlySales: 8,
    returns: 12,
    goalProgress: 70,
    status: 'onTrack',
    specialty: 'Venda residencial',
    responseTime: '26 min',
  },
  {
    id: 'kenji-sato',
    profileId: 'felipe-andrade',
    name: 'Kenji Sato',
    role: 'Corretor pleno',
    avatarUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80',
    properties: 22,
    leads: 14,
    monthlySales: 6,
    returns: 9,
    goalProgress: 60,
    status: 'attention',
    specialty: 'Primeira moradia',
    responseTime: '31 min',
  },
  {
    id: 'barbara-cruz',
    profileId: 'camila-rocha',
    name: 'Barbara Cruz',
    role: 'Corretora pleno',
    avatarUrl:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=160&q=80',
    properties: 19,
    leads: 8,
    monthlySales: 4,
    returns: 7,
    goalProgress: 50,
    status: 'attention',
    specialty: 'Studio e investimento',
    responseTime: '38 min',
  },
]

const totalProperties = brokerTeamMembers.reduce((total, broker) => total + broker.properties, 0)
const totalSales = brokerTeamMembers.reduce((total, broker) => total + broker.monthlySales, 0)
const averageGoal = Math.round(
  brokerTeamMembers.reduce((total, broker) => total + broker.goalProgress, 0) /
    brokerTeamMembers.length,
)

export const brokerTeamKpis: readonly BrokerTeamKpi[] = [
  {
    id: 'active-brokers',
    labelKey: 'activeBrokers',
    value: String(brokerTeamMembers.length),
    helperKey: 'activeBrokersHelper',
  },
  {
    id: 'properties',
    labelKey: 'properties',
    value: String(totalProperties),
    helperKey: 'propertiesHelper',
  },
  {
    id: 'monthly-sales',
    labelKey: 'monthlySales',
    value: String(totalSales),
    helperKey: 'monthlySalesHelper',
  },
  {
    id: 'average-goal',
    labelKey: 'averageGoal',
    value: `${averageGoal}%`,
    helperKey: 'averageGoalHelper',
  },
]
