import { ForbiddenError } from '@server/shared/errors'

import { CannotDeactivateSelfError, UserNotFoundError } from '../../domain/errors'
import { toAuthenticatedUser, type AuthenticatedUser, type Papel } from '../../domain/user.entity'
import type { RefreshTokenRepository } from '../ports/refresh-token-repository.port'
import type { UserRepository } from '../ports/user-repository.port'

export interface DeactivateAdminInput {
  actorId: string
  actorTenantId: string
  actorPapel: Papel
  adminId: string
}

export type DeactivateAdminOutput = AuthenticatedUser

export class DeactivateAdminUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(input: DeactivateAdminInput): Promise<DeactivateAdminOutput> {
    if (input.actorPapel !== 'ADMIN') {
      throw new ForbiddenError('Apenas administradores podem desativar administradores.')
    }

    if (input.actorId === input.adminId) {
      throw new CannotDeactivateSelfError()
    }

    const target = await this.userRepository.findById(input.adminId)

    if (!target || target.tenantId !== input.actorTenantId || target.papel !== 'ADMIN') {
      throw new UserNotFoundError()
    }

    const deactivated = await this.userRepository.deactivate(input.adminId)
    await this.refreshTokenRepository.revokeAllForUser(input.adminId)

    return toAuthenticatedUser(deactivated)
  }
}
