import { ForbiddenError } from '@server/shared/errors'

import { UserNotFoundError } from '../../domain/errors'
import { toAuthenticatedUser, type AuthenticatedUser, type Papel } from '../../domain/user.entity'
import type { UserRepository } from '../ports/user-repository.port'

export interface ApproveUserMembershipInput {
  actorTenantId: string
  actorPapel: Papel
  userId: string
}

export type ApproveUserMembershipOutput = AuthenticatedUser

export class ApproveUserMembershipUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: ApproveUserMembershipInput): Promise<ApproveUserMembershipOutput> {
    if (input.actorPapel !== 'ADMIN') {
      throw new ForbiddenError('Apenas administradores podem aprovar vínculos.')
    }

    const target = await this.userRepository.findById(input.userId)

    if (!target || target.tenantId !== input.actorTenantId || target.papel === 'ADMIN') {
      throw new UserNotFoundError()
    }

    if (target.vinculoAprovadoEm !== null) {
      return toAuthenticatedUser(target)
    }

    const approved = await this.userRepository.approveMembership(input.userId)

    return toAuthenticatedUser(approved)
  }
}
