import { isAgencyManager } from '../../domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import { CannotDeactivateSelfError, UserNotFoundError } from '../../domain/errors'
import { toAuthenticatedUser, type AuthenticatedUser, type Papel } from '../../domain/user.entity'
import type { RefreshTokenRepository } from '../ports/refresh-token-repository.port'
import type { UserRepository } from '../ports/user-repository.port'

export interface DeactivateUserInput {
  actorId: string
  actorTenantId: string
  actorPapel: Papel
  userId: string
}

export type DeactivateUserOutput = AuthenticatedUser

export class DeactivateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(input: DeactivateUserInput): Promise<DeactivateUserOutput> {
    if (!isAgencyManager(input.actorPapel)) {
      throw new ForbiddenError('Apenas a gestão da imobiliária pode desativar usuários.')
    }

    if (input.actorId === input.userId) {
      throw new CannotDeactivateSelfError()
    }

    const target = await this.userRepository.findById(input.userId)

    if (!target || target.tenantId !== input.actorTenantId) {
      throw new UserNotFoundError()
    }

    const deactivated = await this.userRepository.deactivate(input.userId)
    await this.refreshTokenRepository.revokeAllForUser(input.userId)

    return toAuthenticatedUser(deactivated)
  }
}
