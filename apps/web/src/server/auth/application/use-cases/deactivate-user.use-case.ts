import type { DeactivateUserOutput } from '../../types/use-case-outputs'
import type { DeactivateUserInput } from '../../types/use-case-inputs'
import { isAgencyManager } from '../../domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import { CannotDeactivateSelfError, UserNotFoundError } from '../../domain/errors'
import { toAuthenticatedUser } from '../../domain/user.entity'
import type { UserRepository } from '../ports/user-repository.port'

export class DeactivateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

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

    const deactivated = await this.userRepository.deactivate(input.userId, input.actorTenantId, {
      kind: 'USER',
      id: input.actorId,
    })

    return toAuthenticatedUser(deactivated)
  }
}
