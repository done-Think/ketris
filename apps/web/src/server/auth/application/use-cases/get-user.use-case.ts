import type { GetUserOutput } from '../../types/use-case-outputs'
import type { GetUserInput } from '../../types/use-case-inputs'
import { isAgencyManager } from '../../domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import { UserNotFoundError } from '../../domain/errors'
import { toAuthenticatedUser } from '../authenticated-user'
import type { UserRepository } from '../ports/user-repository.port'

export class GetUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetUserInput): Promise<GetUserOutput> {
    if (input.actorId !== input.userId && !isAgencyManager(input.actorRole)) {
      throw new ForbiddenError('Apenas a gestão da imobiliária pode consultar usuários.')
    }

    const user = await this.userRepository.findById(input.userId)

    if (!user || user.tenantId !== input.actorTenantId) {
      throw new UserNotFoundError()
    }

    return toAuthenticatedUser(user)
  }
}
