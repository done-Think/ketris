import { ForbiddenError } from '@server/shared/errors'

import { toAuthenticatedUser, type AuthenticatedUser, type Papel } from '../../domain/user.entity'
import type { UserRepository } from '../ports/user-repository.port'

export interface ListUsersInput {
  actorTenantId: string
  actorPapel: Papel
}

export type ListUsersOutput = AuthenticatedUser[]

export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: ListUsersInput): Promise<ListUsersOutput> {
    if (input.actorPapel !== 'ADMIN') {
      throw new ForbiddenError('Apenas administradores podem listar usuários.')
    }

    const users = await this.userRepository.findManyByTenant(input.actorTenantId)

    return users.filter((user) => user.papel !== 'ADMIN').map(toAuthenticatedUser)
  }
}
