import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'

import type {
  AgencyActivity,
  AgencyOverviewKpi,
  AgencyRevenuePoint,
  AgencySidebarNavItem,
  AgencyTopBroker,
} from '../types/agency-overview'

export const agencyOverviewNavItems: readonly AgencySidebarNavItem[] = [
  { id: 'overview', labelKey: 'overview', icon: BarChartOutlinedIcon },
  { id: 'team', labelKey: 'team', icon: GroupsOutlinedIcon },
  { id: 'portfolio', labelKey: 'portfolio', icon: ApartmentOutlinedIcon },
  { id: 'finance', labelKey: 'finance', icon: PaidOutlinedIcon },
  { id: 'contracts', labelKey: 'contracts', icon: DescriptionOutlinedIcon },
]

export const agencyOverviewKpis: readonly AgencyOverviewKpi[] = [
  {
    id: 'portfolio',
    labelKey: 'portfolio',
    value: '342',
    helper: '+12 este mes',
    tone: 'success',
  },
  {
    id: 'brokers',
    labelKey: 'activeBrokers',
    value: '18',
    helper: '100% da equipe',
    tone: 'neutral',
  },
  {
    id: 'leads',
    labelKey: 'receivedLeads',
    value: '156',
    helper: '+23% este mes',
    tone: 'success',
  },
  {
    id: 'revenue',
    labelKey: 'revenue',
    value: 'R$ 284k',
    helper: '+8% vs meta',
    tone: 'success',
  },
  {
    id: 'occupancy',
    labelKey: 'occupancy',
    value: '91%',
    helper: 'Saudavel',
    tone: 'success',
    progress: 91,
  },
]

export const agencyRevenuePerformance: readonly AgencyRevenuePoint[] = [
  { month: 'Abr', revenue: 92, target: 86 },
  { month: 'Mai', revenue: 132, target: 98 },
  { month: 'Jun', revenue: 148, target: 104 },
  { month: 'Jul', revenue: 166, target: 132 },
  { month: 'Ago', revenue: 214, target: 152 },
  { month: 'Set', revenue: 236, target: 176 },
]

export const agencyTopBrokers: readonly AgencyTopBroker[] = [
  {
    id: 'marina',
    name: 'Marina Souza',
    profileId: 'marina-costa',
    sales: 14,
    revenue: 'R$ 94k',
    recentSales: [
      {
        id: 'marina-pinheiros',
        propertyId: 'studio-pinheiros',
        property: 'Condominio Pinheiros',
        location: 'Pinheiros',
        value: 'R$ 2.4M',
        closedAt: 'Hoje',
      },
      {
        id: 'marina-jardins',
        propertyId: 'apt-jardins-3q',
        property: 'Apt Jardins 3q',
        location: 'Jardins',
        value: 'R$ 1.8M',
        closedAt: 'Ontem',
      },
      {
        id: 'marina-paulista',
        propertyId: 'cobertura-itaim',
        property: 'Cobertura Paulista',
        location: 'Paulista',
        value: 'R$ 3.1M',
        closedAt: '3 dias atras',
      },
    ],
  },
  {
    id: 'thiago',
    name: 'Thiago Lopes',
    profileId: 'thiago-santos',
    sales: 11,
    revenue: 'R$ 72k',
    recentSales: [
      {
        id: 'thiago-itaim',
        propertyId: 'cobertura-itaim',
        property: 'Apartamento Itaim Bibi',
        location: 'Itaim Bibi',
        value: 'R$ 1.5M',
        closedAt: 'Hoje',
      },
      {
        id: 'thiago-pinheiros',
        propertyId: 'studio-pinheiros',
        property: 'Studio Pinheiros',
        location: 'Pinheiros',
        value: 'R$ 790k',
        closedAt: '2 dias atras',
      },
      {
        id: 'thiago-vila-madalena',
        propertyId: 'studio-bela-vista',
        property: 'Loft Vila Madalena',
        location: 'Vila Madalena',
        value: 'R$ 890k',
        closedAt: '5 dias atras',
      },
    ],
  },
  {
    id: 'ana',
    name: 'Ana Costa',
    profileId: 'ana-silva',
    sales: 9,
    revenue: 'R$ 55k',
    recentSales: [
      {
        id: 'ana-moema',
        propertyId: 'apt-moema-2q',
        property: 'Apartamento Moema',
        location: 'Moema',
        value: 'R$ 1.2M',
        closedAt: 'Ontem',
      },
      {
        id: 'ana-casa-jardins',
        propertyId: 'casa-alto-pinheiros',
        property: 'Casa Jardins',
        location: 'Jardins',
        value: 'R$ 3.8M',
        closedAt: '4 dias atras',
      },
      {
        id: 'ana-vila-nova',
        propertyId: 'apt-moema-2q',
        property: 'Apt Vila Nova',
        location: 'Vila Nova Conceicao',
        value: 'R$ 2.1M',
        closedAt: '1 semana atras',
      },
    ],
  },
  {
    id: 'lucas',
    name: 'Lucas Ramos',
    profileId: 'renato-alves',
    sales: 8,
    revenue: 'R$ 48k',
    recentSales: [
      {
        id: 'lucas-alto-pinheiros',
        propertyId: 'casa-alto-pinheiros',
        property: 'Casa Alto de Pinheiros',
        location: 'Alto de Pinheiros',
        value: 'R$ 3.8M',
        closedAt: '2 dias atras',
      },
      {
        id: 'lucas-brooklin',
        propertyId: 'apt-moema-2q',
        property: 'Apartamento Brooklin',
        location: 'Brooklin',
        value: 'R$ 1.1M',
        closedAt: '6 dias atras',
      },
      {
        id: 'lucas-morumbi',
        propertyId: 'casa-alto-pinheiros',
        property: 'Garden Morumbi',
        location: 'Morumbi',
        value: 'R$ 1.7M',
        closedAt: '1 semana atras',
      },
    ],
  },
  {
    id: 'kenji',
    name: 'Kenji Sato',
    profileId: 'felipe-andrade',
    sales: 6,
    revenue: 'R$ 39k',
    recentSales: [
      {
        id: 'kenji-higienopolis',
        propertyId: 'studio-bela-vista',
        property: 'Apt Higienopolis',
        location: 'Higienopolis',
        value: 'R$ 1.4M',
        closedAt: '3 dias atras',
      },
      {
        id: 'kenji-liberdade',
        propertyId: 'studio-pinheiros',
        property: 'Studio Liberdade',
        location: 'Liberdade',
        value: 'R$ 520k',
        closedAt: '1 semana atras',
      },
      {
        id: 'kenji-sumare',
        propertyId: 'apt-jardins-3q',
        property: 'Apartamento Sumare',
        location: 'Sumare',
        value: 'R$ 960k',
        closedAt: '2 semanas atras',
      },
    ],
  },
]

export const agencyRecentActivities: readonly AgencyActivity[] = [
  {
    id: 'contract-sale',
    broker: 'Marina',
    actionKey: 'closedSale',
    detail: 'Condominio Pinheiros',
    detailKey: 'contractSale',
    timeAgo: '10m atras',
    tone: 'contract',
  },
  {
    id: 'new-property',
    broker: 'Thiago',
    actionKey: 'createdProperty',
    detail: 'Itaim Bibi',
    detailKey: 'newProperty',
    timeAgo: '45m atras',
    tone: 'property',
  },
  {
    id: 'visit-scheduled',
    broker: 'Ana',
    actionKey: 'scheduledVisit',
    detail: 'Casa Jardins',
    detailKey: 'visitScheduled',
    timeAgo: '2 horas atras',
    tone: 'visit',
  },
  {
    id: 'new-lead',
    broker: '',
    actionKey: 'receivedLead',
    detail: 'portal Ketris',
    detailKey: 'newLead',
    timeAgo: '4 horas atras',
    tone: 'lead',
  },
  {
    id: 'rent-contract',
    broker: '',
    actionKey: 'signedRent',
    detail: 'Studio Moema',
    detailKey: 'rentContract',
    timeAgo: 'Ontem',
    tone: 'contract',
  },
]
