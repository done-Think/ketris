import { ForbiddenError } from '@server/shared/errors'

import { UserNotFoundError } from '../../domain/errors'
import { toAuthenticatedUser, type AuthenticatedUser, type Papel } from '../../domain/user.entity'
import type { UserRepository } from '../ports/user-repository.port'

export interface GetUserInput {
  actorTenantId: string
  actorPapel: Papel
  userId: string
}

export type GetUserOutput = AuthenticatedUser

export class GetUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetUserInput): Promise<GetUserOutput> {
    if (input.actorPapel !== 'ADMIN') {
      throw new ForbiddenError('Apenas administradores podem consultar usuários.')
    }

    const user = await this.userRepository.findById(input.userId)

    if (!user || user.tenantId !== input.actorTenantId || user.papel === 'ADMIN') {
      throw new UserNotFoundError()
    }

    return toAuthenticatedUser(user)
  }
}
