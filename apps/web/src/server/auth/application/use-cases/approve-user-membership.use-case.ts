import type { ApproveUserMembershipOutput } from '../../types/use-case-outputs'
import type { ApproveUserMembershipInput } from '../../types/use-case-inputs'
import { isAgencyManager } from '../../domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import { UserNotFoundError } from '../../domain/errors'
import { toAuthenticatedUser } from '../authenticated-user'
import type { UserRepository } from '../ports/user-repository.port'

export class ApproveUserMembershipUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: ApproveUserMembershipInput): Promise<ApproveUserMembershipOutput> {
    if (!isAgencyManager(input.actorRole)) {
      throw new ForbiddenError('Apenas a gestão da imobiliária pode aprovar vínculos.')
    }

    const target = await this.userRepository.findById(input.userId)

    if (!target || target.tenantId !== input.actorTenantId) {
      throw new UserNotFoundError()
    }

    if (target.membershipApprovedAt !== null) {
      return toAuthenticatedUser(target)
    }

    const approved = await this.userRepository.approveMembership(
      input.userId,
      input.actorTenantId,
      { kind: 'USER', id: input.actorId },
    )

    return toAuthenticatedUser(approved)
  }
}
