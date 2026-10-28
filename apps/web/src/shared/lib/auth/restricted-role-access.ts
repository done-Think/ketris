import type { UserRole } from '@shared/types/user-role'
import type { RestrictedRole, RestrictedRoleAccess } from '@shared/types/restricted-role-access'

const propertyDetailPathname = /^\/dashboard\/properties(?:\/(?!new(?:\/|$))[^/]+)?\/?$/
const propertyPathname = /^\/dashboard\/properties(?:\/(?:new|[^/]+(?:\/edit)?))?\/?$/
const profilePathname = /^\/dashboard\/profile(?:\/.*)?$/
const maintenancePathname = /^\/dashboard\/maintenance(?:\/[^/]+)?\/?$/
const contractsPathname = /^\/dashboard\/contracts(?:\/(?!new(?:\/|$))[^/]+)?\/?$/
const chargesPathname = /^\/dashboard\/finance\/charges(?:\/[^/]+)?\/?$/

export const restrictedRoleAccess: Record<RestrictedRole, RestrictedRoleAccess> = {
  RENTER: {
    home: '/dashboard/finance/charges',
    navigationHrefs: [
      '/dashboard/finance/charges',
      '/dashboard/maintenance',
      '/dashboard/agenda',
      '/dashboard/properties',
    ],
    isAllowedPathname: (pathname) =>
      pathname === '/dashboard/agenda' ||
      chargesPathname.test(pathname) ||
      maintenancePathname.test(pathname) ||
      propertyDetailPathname.test(pathname),
    canManageProperties: false,
    canManageAgenda: true,
    canEditProfile: false,
  },
  PROPERTY_OWNER: {
    home: '/dashboard/properties',
    navigationHrefs: [
      '/dashboard/properties',
      '/dashboard/contracts',
      '/dashboard/finance/charges',
      '/dashboard/maintenance',
      '/dashboard/agenda',
    ],
    isAllowedPathname: (pathname) =>
      pathname === '/dashboard/agenda' ||
      contractsPathname.test(pathname) ||
      chargesPathname.test(pathname) ||
      maintenancePathname.test(pathname) ||
      propertyPathname.test(pathname) ||
      profilePathname.test(pathname),
    canManageProperties: true,
    canManageAgenda: true,
    canEditProfile: true,
  },
}

export function getRestrictedRoleAccess(role: UserRole | undefined): RestrictedRoleAccess | null {
  if (role === 'RENTER' || role === 'PROPERTY_OWNER') return restrictedRoleAccess[role]

  return null
}

export function getRoleHomePathname(role: UserRole | undefined, fallback: string): string {
  return getRestrictedRoleAccess(role)?.home ?? fallback
}
