import type { Papel } from '@server/auth/domain/user.entity'

export type RestrictedRole = Extract<Papel, 'RENTER' | 'PROPERTY_OWNER'>

export type RestrictedRoleAccess = {
  home: string
  navigationHrefs: readonly string[]
  isAllowedPathname: (pathname: string) => boolean
  canManageProperties: boolean
  canManageAgenda: boolean
  canEditProfile: boolean
}
