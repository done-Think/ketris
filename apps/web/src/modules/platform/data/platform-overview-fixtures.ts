import type {
  GrowthTrendPoint,
  PlatformAlert,
  PlatformMetric,
  RecentTenant,
} from '../types/platform-overview'

/** Demonstration-only content for the Platform Overview. */
export const platformMetrics: readonly PlatformMetric[] = [
  { id: 'tenants', value: '45' },
  { id: 'brokers', value: '680' },
  { id: 'properties', value: '12.4k' },
  { id: 'mrr', value: 'R$ 89.6k', indicator: '+15%', tone: 'success' },
  { id: 'churn', value: '2.1%', indicator: 'Stable', tone: 'success' },
  { id: 'uptime', value: '99.97%', indicator: 'Normal', tone: 'success' },
]

export const growthTrend: readonly GrowthTrendPoint[] = [
  { month: 'jan', tenants: 45, contracts: 52 },
  { month: 'feb', tenants: 60, contracts: 58 },
  { month: 'mar', tenants: 55, contracts: 68 },
  { month: 'apr', tenants: 72, contracts: 75 },
  { month: 'may', tenants: 90, contracts: 92 },
  { month: 'jun', tenants: 82, contracts: 105 },
  { month: 'jul', tenants: 105, contracts: 120 },
  { month: 'aug', tenants: 120, contracts: 118 },
  { month: 'sep', tenants: 110, contracts: 130 },
  { month: 'oct', tenants: 140, contracts: 150 },
  { month: 'nov', tenants: 155, contracts: 165 },
  { month: 'dec', tenants: 180, contracts: 180 },
]

export const platformAlerts: readonly PlatformAlert[] = [
  { id: 'backup', time: '2m ago', tone: 'error' },
  { id: 'cpu', time: '15m ago', tone: 'warning' },
  { id: 'ssl', time: '1h ago', tone: 'info' },
  { id: 'tenant-registration', time: '3h ago', tone: 'info' },
]

export const recentTenants: readonly RecentTenant[] = [
  {
    id: 'apex',
    name: 'Apex Brokers S/A',
    plan: 'enterprise',
    brokers: 45,
    registeredAt: '2026-03-01',
    status: 'active',
  },
  {
    id: 'lopes',
    name: 'Lopes Imóveis SP',
    plan: 'enterprise',
    brokers: 120,
    registeredAt: '2026-02-28',
    status: 'active',
  },
  {
    id: 'alianca',
    name: 'Aliança Prime',
    plan: 'proGrowth',
    brokers: 18,
    registeredAt: '2026-02-27',
    status: 'provisioning',
  },
  {
    id: 'brokers',
    name: 'Brokers Consultoria',
    plan: 'starterPack',
    brokers: 5,
    registeredAt: '2026-02-25',
    status: 'active',
  },
  {
    id: 'nobre',
    name: 'Nobre Imobiliária',
    plan: 'proGrowth',
    brokers: 24,
    registeredAt: '2026-02-24',
    status: 'suspended',
  },
]

export const platformLiveUtcDisplay = '2026-03-01 19:35'
