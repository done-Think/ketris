import type { UserRole } from './user.entity'

export const agencyManagerRoles = ['OWNER'] as const satisfies readonly UserRole[]

export const agencyStaffRoles = ['OWNER', 'AGENT'] as const satisfies readonly UserRole[]

export function isAgencyManager(role: UserRole): boolean {
  return (agencyManagerRoles as readonly UserRole[]).includes(role)
}

export function isAgencyStaff(role: UserRole): boolean {
  return (agencyStaffRoles as readonly UserRole[]).includes(role)
}

export function isPropertyOwner(role: UserRole): boolean {
  return role === 'PROPERTY_OWNER'
}
