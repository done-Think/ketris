import type { UserRole } from '@shared/types/user-role'

export type RestrictedRole = Extract<UserRole, 'RENTER' | 'PROPERTY_OWNER'>

export type RestrictedRoleAccess = {
  home: '/dashboard/finance/charges' | '/dashboard/properties'
  navigationHrefs: readonly string[]
  isAllowedPathname: (pathname: string) => boolean
  canManageProperties: boolean
  canManageAgenda: boolean
  canEditProfile: boolean
}
