import { TenantNotFoundError } from '../../domain/errors'
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

    return this.platformTenantRepository.updateAccount(tenant.id, {
      accountType: input.accountType,
      status: input.status,
      canceledAt: resolveCanceledAt(tenant, input.status, this.now()),
    })
  }
}
