import { describe, expect, it } from 'vitest'

import {
  getRestrictedRoleAccess,
  getRoleHomePathname,
} from '@shared/lib/auth/restricted-role-access'

describe('restricted-role-access', () => {
  it.each(['OWNER', 'AGENT', undefined] as const)('não restringe %s', (role) => {
    expect(getRestrictedRoleAccess(role)).toBeNull()
    expect(getRoleHomePathname(role, '/dashboard')).toBe('/dashboard')
  })

  it('leva o locatário para as cobranças e libera só as rotas dele', () => {
    const access = getRestrictedRoleAccess('RENTER')

    expect(getRoleHomePathname('RENTER', '/dashboard')).toBe('/dashboard/finance/charges')
    expect(access?.isAllowedPathname('/dashboard/finance/charges/abc')).toBe(true)
    expect(access?.isAllowedPathname('/dashboard/properties/abc')).toBe(true)
    expect(access?.isAllowedPathname('/dashboard/properties/new')).toBe(false)
    expect(access?.isAllowedPathname('/crm')).toBe(false)
    expect(access).toMatchObject({
      canManageProperties: false,
      canManageAgenda: true,
      canEditProfile: false,
    })
  })

  it('leva o proprietário aos imóveis e libera contratos e cobranças, sem CRM', () => {
    const access = getRestrictedRoleAccess('PROPERTY_OWNER')

    expect(getRoleHomePathname('PROPERTY_OWNER', '/dashboard')).toBe('/dashboard/properties')
    expect(access?.isAllowedPathname('/dashboard/properties')).toBe(true)
    expect(access?.isAllowedPathname('/dashboard/properties/abc')).toBe(true)
    expect(access?.isAllowedPathname('/dashboard/properties/new')).toBe(true)
    expect(access?.isAllowedPathname('/dashboard/properties/abc/edit')).toBe(true)
    expect(access?.isAllowedPathname('/dashboard/profile')).toBe(true)
    expect(access?.isAllowedPathname('/dashboard/maintenance/abc')).toBe(true)
    expect(access?.isAllowedPathname('/dashboard/agenda')).toBe(true)
    expect(access?.isAllowedPathname('/dashboard/finance/charges')).toBe(true)
    expect(access?.isAllowedPathname('/dashboard/contracts/abc')).toBe(true)
    expect(access?.isAllowedPathname('/dashboard/contracts/new')).toBe(false)
    expect(access?.isAllowedPathname('/dashboard/finance')).toBe(false)
    expect(access?.isAllowedPathname('/crm/contacts')).toBe(false)
    expect(access?.navigationHrefs).toContain('/dashboard/finance/charges')
    expect(access).toMatchObject({
      canManageProperties: true,
      canManageAgenda: true,
      canEditProfile: true,
    })
  })
})
