import { toAuthenticatedUser } from '@server/auth/domain/user.entity'
import type { UserListRepository } from '@server/auth/application/ports/user-list-repository.port'

import { TenantNotFoundError } from '../../domain/errors'
import type { TenantRepository } from '../ports/tenant-repository.port'
import type { ListTenantUsersInput, ListTenantUsersOutput } from '../../types/use-case-inputs'

export class ListTenantUsersUseCase {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly userRepository: UserListRepository,
  ) {}

  async execute(input: ListTenantUsersInput): Promise<ListTenantUsersOutput> {
    const tenant = await this.tenantRepository.findById(input.tenantId)

    if (!tenant) {
      throw new TenantNotFoundError()
    }

    const { users, total } = await this.userRepository.findPageByTenant(tenant.id, {
      page: input.page,
      pageSize: input.pageSize,
    })

    return {
      items: users.map(toAuthenticatedUser),
      totalCount: total,
      page: input.page,
      pageSize: input.pageSize,
    }
  }
}
