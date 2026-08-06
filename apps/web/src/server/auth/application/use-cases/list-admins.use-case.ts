import { ForbiddenError } from '@server/shared/errors'

import { toAuthenticatedUser, type AuthenticatedUser, type Papel } from '../../domain/user.entity'
import type { UserRepository } from '../ports/user-repository.port'

export interface ListAdminsInput {
  actorTenantId: string
  actorPapel: Papel
}

export type ListAdminsOutput = AuthenticatedUser[]

export class ListAdminsUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: ListAdminsInput): Promise<ListAdminsOutput> {
    if (input.actorPapel !== 'ADMIN') {
      throw new ForbiddenError('Apenas administradores podem listar administradores.')
    }

    const users = await this.userRepository.findManyByTenant(input.actorTenantId)

    return users.filter((user) => user.papel === 'ADMIN').map(toAuthenticatedUser)
  }
}
