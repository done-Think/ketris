import type { ReactNode } from 'react'

import type { UserRole } from '@shared/types/user-role'

export type RoleGuardProps = {
  allowedRoles: readonly UserRole[]
  children: ReactNode
}
