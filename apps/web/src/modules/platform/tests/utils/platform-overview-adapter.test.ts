import { describe, expect, it } from 'vitest'

import {
  mapGrowthTrend,
  mapPlatformMetricsToCards,
  mapRecentTenants,
} from '../../utils/platform-overview-adapter'

describe('mapPlatformMetricsToCards', () => {
  it('maps the real counts to tenants, brokers and properties cards only', () => {
    const cards = mapPlatformMetricsToCards({
      tenantsCount: 12,
      brokersCount: 48,
      propertiesCount: 230,
    })

    expect(cards).toEqual([
      { id: 'tenants', value: 12, format: 'number' },
      { id: 'brokers', value: 48, format: 'number' },
      { id: 'properties', value: 230, format: 'compactNumber' },
    ])
  })
})

describe('mapGrowthTrend', () => {
  it('converts month numbers to translation keys', () => {
    const points = mapGrowthTrend([
      { year: 2026, month: 1, tenants: 2, contracts: 3 },
      { year: 2026, month: 12, tenants: 4, contracts: 5 },
    ])

    expect(points).toEqual([
      { month: 'jan', tenants: 2, contracts: 3 },
      { month: 'dec', tenants: 4, contracts: 5 },
    ])
  })
})

describe('mapRecentTenants', () => {
  it('maps the API shape to the table row shape without inventing plan or status', () => {
    const rows = mapRecentTenants([
      {
        id: 'tenant-1',
        name: 'Alameda Prime',
        brokersCount: 6,
        propertiesCount: 40,
        createdAt: '2026-10-01T00:00:00.000Z',
      },
    ])

    expect(rows).toEqual([
      {
        id: 'tenant-1',
        name: 'Alameda Prime',
        brokers: 6,
        properties: 40,
        registeredAt: '2026-10-01T00:00:00.000Z',
      },
    ])
  })
})
