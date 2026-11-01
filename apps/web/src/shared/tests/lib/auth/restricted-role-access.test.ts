import { describe, expect, it } from 'vitest'

import {
  getRestrictedRoleAccess,
  getRoleHomePathname,
} from '@shared/lib/auth/restricted-role-access'

describe('restricted-role-access', () => {
  it.each(['RENTER', 'PROPERTY_OWNER'] as const)(
    'allows %s to access only their own Face Check page',
    (role) => {
      const access = getRestrictedRoleAccess(role)
      expect(access?.navigationHrefs).toContain('/dashboard/face_check/my-verifications')
      expect(access?.isAllowedPathname('/dashboard/face_check/my-verifications')).toBe(true)
      expect(access?.isAllowedPathname('/dashboard/face_check/my-verifications/verification')).toBe(
        true,
      )
      expect(
        access?.isAllowedPathname('/dashboard/face_check/my-verifications/verification/extra'),
      ).toBe(false)
      for (const path of [
        '/dashboard/face_check',
        '/dashboard/face_check/sessions',
        '/dashboard/face_check/settings',
      ])
        expect(access?.isAllowedPathname(path)).toBe(false)
    },
  )
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
