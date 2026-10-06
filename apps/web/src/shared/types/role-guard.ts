import type { ReactNode } from 'react'

import type { Papel } from '@server/auth/domain/user.entity'

export type RoleGuardProps = {
  allowedRoles: readonly Papel[]
  children: ReactNode
}
