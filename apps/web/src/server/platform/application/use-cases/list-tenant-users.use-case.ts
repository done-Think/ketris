import { toAuthenticatedUser, type AuthenticatedUser } from '@server/auth/domain/user.entity'
import type { UserRepository } from '@server/auth/application/ports/user-repository.port'

import { TenantNotFoundError } from '../../domain/errors'
import type { TenantRepository } from '../ports/tenant-repository.port'

export interface ListTenantUsersInput {
  tenantId: string
}

export type ListTenantUsersOutput = AuthenticatedUser[]

export class ListTenantUsersUseCase {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: ListTenantUsersInput): Promise<ListTenantUsersOutput> {
    const tenant = await this.tenantRepository.findById(input.tenantId)

    if (!tenant) {
      throw new TenantNotFoundError()
    }

    const users = await this.userRepository.findManyByTenant(tenant.id)

    return users.map(toAuthenticatedUser)
  }
}
