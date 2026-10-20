import { TenantAccountChangedConcurrentlyError, TenantNotFoundError } from '../../domain/errors'
import type { PlatformTenant } from '../../domain/platform-tenant.entity'
import {
  resolveCanceledAt,
  type TenantAccountType,
  type TenantStatus,
} from '../../domain/tenant-account'
import type { PlatformTenantRepository } from '../ports/platform-tenant-repository.port'

export interface UpdateTenantAccountInput {
  tenantId: string
  accountType: TenantAccountType
  status: TenantStatus
  // Platform admin making the change, kept in the status history.
  actorId: string | null
}

export class UpdateTenantAccountUseCase {
  constructor(
    private readonly platformTenantRepository: PlatformTenantRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: UpdateTenantAccountInput): Promise<PlatformTenant> {
    const tenant = await this.platformTenantRepository.findById(input.tenantId)

    if (!tenant) {
      throw new TenantNotFoundError()
    }

    const now = this.now()
    const statusChanged = tenant.status !== input.status
    const updated = await this.platformTenantRepository.updateAccount(
      tenant.id,
      tenant.status,
      {
        accountType: input.accountType,
        status: input.status,
        canceledAt: resolveCanceledAt(tenant, input.status, now),
      },
      statusChanged
        ? {
            fromStatus: tenant.status,
            toStatus: input.status,
            changedAt: now,
            changedById: input.actorId,
          }
        : null,
    )

    if (!updated) {
      throw new TenantAccountChangedConcurrentlyError()
    }

    return updated
  }
}
