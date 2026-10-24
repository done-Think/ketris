import type { Papel } from './user.entity'

export const agencyManagerRoles = ['OWNER'] as const satisfies readonly Papel[]

export const agencyStaffRoles = ['OWNER', 'AGENT'] as const satisfies readonly Papel[]

export function isAgencyManager(papel: Papel): boolean {
  return (agencyManagerRoles as readonly Papel[]).includes(papel)
}

export function isAgencyStaff(papel: Papel): boolean {
  return (agencyStaffRoles as readonly Papel[]).includes(papel)
}

export function isPropertyOwner(papel: Papel): boolean {
  return papel === 'PROPERTY_OWNER'
}
