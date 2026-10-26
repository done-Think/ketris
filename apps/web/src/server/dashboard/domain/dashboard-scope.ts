import { isAgencyManager, isAgencyStaff } from '@server/auth/domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import type { DashboardScope, GetDashboardOverviewInput } from '../types/dashboard-overview'

export function resolveDashboardScope(actor: GetDashboardOverviewInput): DashboardScope {
  if (!isAgencyStaff(actor.actorPapel)) {
    throw new ForbiddenError('Só a equipe da imobiliária acessa o dashboard.')
  }

  return {
    tenantId: actor.actorTenantId,
    agentId: isAgencyManager(actor.actorPapel) ? null : actor.actorId,
  }
}
