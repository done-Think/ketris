import { describe, expect, it } from 'vitest'

import {
  canAccessFeature,
  dashboardFeaturesByProfile,
  homeHrefFor,
  navigationHrefsFor,
  resolveAccessProfile,
} from '@shared/lib/auth/access-policy'

describe('resolveAccessProfile', () => {
  it.each([
    ['OWNER', 'AGENCY', 'AGENCY_MANAGER'],
    ['OWNER', 'BROKER', 'SOLO_BROKER'],
    ['OWNER', 'INDIVIDUAL', 'INDIVIDUAL_OWNER'],
    ['AGENT', 'AGENCY', 'AGENT'],
    ['PROPERTY_OWNER', 'AGENCY', 'PROPERTY_OWNER'],
    ['RENTER', 'INDIVIDUAL', 'RENTER'],
  ] as const)('maps %s on a %s account to %s', (role, accountType, expected) => {
    expect(resolveAccessProfile(role, accountType)).toBe(expected)
  })

  it('denies an owner whose account type is unknown', () => {
    expect(resolveAccessProfile('OWNER', undefined)).toBeNull()
    expect(resolveAccessProfile(undefined, 'AGENCY')).toBeNull()
  })
})

describe('dashboard access matrix', () => {
  it('keeps agency-only screens away from solo brokers and individual owners', () => {
    for (const profile of ['SOLO_BROKER', 'INDIVIDUAL_OWNER', 'AGENT'] as const) {
      expect(canAccessFeature(profile, 'team')).toBe(false)
      expect(canAccessFeature(profile, 'finance')).toBe(false)
      expect(canAccessFeature(profile, 'agencyPublicProfile')).toBe(false)
    }
  })

  it('keeps sales tools away from owners of a property and renters', () => {
    for (const profile of ['PROPERTY_OWNER', 'RENTER'] as const) {
      for (const feature of ['pipeline', 'contacts', 'leads', 'dashboard'] as const)
        expect(canAccessFeature(profile, feature)).toBe(false)
    }
  })

  it('lets individual owners reach their proposals to close a deal, keeping My Properties as home', () => {
    for (const feature of ['pipeline', 'contacts', 'leads', 'contracts'] as const)
      expect(canAccessFeature('INDIVIDUAL_OWNER', feature)).toBe(true)
    expect(canAccessFeature('INDIVIDUAL_OWNER', 'dashboard')).toBe(false)
    expect(homeHrefFor('INDIVIDUAL_OWNER')).toBe('/dashboard/properties')
    expect(navigationHrefsFor('INDIVIDUAL_OWNER').slice(0, 4)).toEqual([
      '/dashboard/properties',
      '/crm',
      '/crm/contacts',
      '/dashboard/leads',
    ])
  })

  it('gives only the agency manager the team and the agency finance screens', () => {
    const withTeam = Object.entries(dashboardFeaturesByProfile)
      .filter(([, features]) => features.includes('team'))
      .map(([profile]) => profile)
    expect(withTeam).toEqual(['AGENCY_MANAGER'])
  })

  it('never grants a feature to a missing profile', () => {
    expect(canAccessFeature(null, 'agenda')).toBe(false)
  })

  it('derives the renter sidebar from the same table', () => {
    expect(navigationHrefsFor('RENTER')).toEqual([
      '/dashboard/finance/charges',
      '/dashboard/maintenance',
      '/dashboard/agenda',
      '/dashboard/properties',
      '/dashboard/face_check/my-verifications',
    ])
  })
})
