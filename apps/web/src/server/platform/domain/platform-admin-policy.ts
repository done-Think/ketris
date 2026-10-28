import { LastPlatformAdminError } from './errors'
import type { PlatformAdmin } from '../types/platform-admin'
import type { PlatformAdminUpdate } from '../types/platform-admin-repository'

export function assertActiveAdministratorRemains(
  target: Pick<PlatformAdmin, 'role' | 'active'>,
  changes: Pick<PlatformAdminUpdate, 'role'> & { active?: boolean },
  activeAdminCount: number,
) {
  const isAdministrator = target.active && target.role === 'ADMIN'
  const remainsAdministrator =
    (changes.active ?? target.active) && (changes.role ?? target.role) === 'ADMIN'

  if (isAdministrator && !remainsAdministrator && activeAdminCount <= 1) {
    throw new LastPlatformAdminError()
  }
}
