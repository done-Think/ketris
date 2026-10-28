import { isAgencyManager, isAgencyStaff } from '@server/auth/domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import type { DashboardScope, GetDashboardOverviewInput } from '../types/dashboard-overview'

export function resolveDashboardScope(actor: GetDashboardOverviewInput): DashboardScope {
  if (!isAgencyStaff(actor.actorRole)) {
    throw new ForbiddenError('Só a equipe da imobiliária acessa o dashboard.')
  }

  return {
    tenantId: actor.actorTenantId,
    agentId: isAgencyManager(actor.actorRole) ? null : actor.actorId,
  }
}
