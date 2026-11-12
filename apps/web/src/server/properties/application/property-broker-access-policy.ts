import { isAgencyManager } from '@server/auth/domain/roles'
import type { UserRole } from '@server/auth/domain/user.entity'
import { ForbiddenError } from '@server/shared/errors'
import { PropertyBrokerValidationError } from '../domain/errors'
import type { PropertyBrokerDirectory } from './ports/property-broker-directory.port'

export async function assertPropertyBrokerChange(
  tenantId: string,
  role: UserRole,
  ids: string[] | undefined,
  directory?: PropertyBrokerDirectory,
): Promise<void> {
  if (ids === undefined) return
  if (!isAgencyManager(role)) throw new ForbiddenError()
  if (new Set(ids).size !== ids.length) throw new PropertyBrokerValidationError()
  if (
    ids.length &&
    (!directory || (await directory.countActiveBrokers(tenantId, ids)) !== ids.length)
  )
    throw new PropertyBrokerValidationError()
}
