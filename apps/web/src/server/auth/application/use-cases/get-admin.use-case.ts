import { ForbiddenError } from '@server/shared/errors'

import { UserNotFoundError } from '../../domain/errors'
import { toAuthenticatedUser, type AuthenticatedUser, type Papel } from '../../domain/user.entity'
import type { UserRepository } from '../ports/user-repository.port'

export interface GetAdminInput {
  actorTenantId: string
  actorPapel: Papel
  adminId: string
}

export type GetAdminOutput = AuthenticatedUser

export class GetAdminUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetAdminInput): Promise<GetAdminOutput> {
    if (input.actorPapel !== 'ADMIN') {
      throw new ForbiddenError('Apenas administradores podem consultar administradores.')
    }

    const admin = await this.userRepository.findById(input.adminId)

    if (!admin || admin.tenantId !== input.actorTenantId || admin.papel !== 'ADMIN') {
      throw new UserNotFoundError()
    }

    return toAuthenticatedUser(admin)
  }
}
