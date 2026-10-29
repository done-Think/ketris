import { describe, expect, it } from 'vitest'

import { getAuthDestination } from '../../utils/auth-destination'

describe('auth destination', () => {
  it.each(['/dashboard', '/en/dashboard', '/pt/dashboard', '/es/dashboard'])(
    'resolves %s through the canonical routing table',
    (callback) => {
      expect(getAuthDestination(callback)).toBe('/dashboard')
    },
  )

  it('resolves a translated private route through the routing table', () => {
    expect(getAuthDestination('/en/dashboard/schedule')).toBe('/dashboard/agenda')
  })

  it('preserves dynamic params and repeated filters', () => {
    expect(getAuthDestination('/pt/dashboard/properties/property-1?tab=media&tag=a&tag=b')).toEqual(
      {
        pathname: '/dashboard/properties/[id]',
        params: { id: 'property-1' },
        query: { tab: 'media', tag: ['a', 'b'] },
      },
    )
  })

  it('accepts an absolute callback only from the current origin', () => {
    expect(
      getAuthDestination('http://localhost:3000/en/dashboard/team', 'http://localhost:3000'),
    ).toBe('/dashboard/team')
  })

  it.each([
    'https://other.example/dashboard',
    '//other.example/dashboard',
    'javascript:alert(1)',
    '/not-a-route',
  ])('uses the dashboard for an invalid callback: %s', (callback) => {
    expect(getAuthDestination(callback)).toBe('/dashboard')
  })
})
