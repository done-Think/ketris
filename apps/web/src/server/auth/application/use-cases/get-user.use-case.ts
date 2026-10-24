import { isAgencyManager } from '../../domain/roles'
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
    if (!isAgencyManager(input.actorPapel)) {
      throw new ForbiddenError('Apenas a gestão da imobiliária pode consultar usuários.')
    }

    const user = await this.userRepository.findById(input.userId)

    if (!user || user.tenantId !== input.actorTenantId) {
      throw new UserNotFoundError()
    }

    return toAuthenticatedUser(user)
  }
}
