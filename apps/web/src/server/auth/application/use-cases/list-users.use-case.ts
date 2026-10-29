import type { ListUsersOutput } from '../../types/use-case-outputs'
import type { ListUsersInput } from '../../types/use-case-inputs'
import { isAgencyManager } from '../../domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import { toAuthenticatedUser } from '../authenticated-user'
import type { UserListRepository } from '../ports/user-list-repository.port'

export class ListUsersUseCase {
  constructor(private readonly userRepository: UserListRepository) {}

  async execute(input: ListUsersInput): Promise<ListUsersOutput> {
    if (!isAgencyManager(input.actorRole)) {
      throw new ForbiddenError('Apenas a gestão da imobiliária pode listar usuários.')
    }

    const result = await this.userRepository.findPageByTenant(input.actorTenantId, {
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 25,
      pendingApproval: input.pendingApproval,
    })

    return { ...result, users: result.users.map(toAuthenticatedUser) }
  }
}
