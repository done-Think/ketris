import { TenantAccountChangedConcurrentlyError, TenantNotFoundError } from '../../domain/errors'
import type { PlatformTenant } from '../../types/platform-tenant'
import { resolveCanceledAt } from '../../domain/tenant-account'
import type { PlatformTenantRepository } from '../ports/platform-tenant-repository.port'
import type { UpdateTenantAccountInput } from '../../types/use-case-inputs'

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
      { accountType: tenant.accountType, status: tenant.status },
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
      if (!(await this.platformTenantRepository.findById(tenant.id))) {
        throw new TenantNotFoundError()
      }
      throw new TenantAccountChangedConcurrentlyError()
    }

    return updated
  }
}
