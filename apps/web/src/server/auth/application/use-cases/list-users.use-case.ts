import { isAgencyManager } from '../../domain/roles'
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
    if (!isAgencyManager(input.actorPapel)) {
      throw new ForbiddenError('Apenas a gestão da imobiliária pode listar usuários.')
    }

    const users = await this.userRepository.findManyByTenant(input.actorTenantId)

    return users.map(toAuthenticatedUser)
  }
}
