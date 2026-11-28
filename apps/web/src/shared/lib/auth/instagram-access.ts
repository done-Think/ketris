import type { UserRole } from '@server/auth/domain/user.entity'
import { isAgencyStaff, isPropertyOwner } from '@server/auth/domain/roles'

export function canConnectInstagram(role: UserRole | undefined): boolean {
  return Boolean(role && (isAgencyStaff(role) || isPropertyOwner(role)))
}
