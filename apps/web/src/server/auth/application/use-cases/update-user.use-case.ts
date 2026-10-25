import type { UpdateUserOutput } from '../../types/use-case-outputs'
import type { UpdateUserInput } from '../../types/use-case-inputs'
import { assertAvatarScope } from '../../domain/avatar-policy'
import { AccountDeactivatedError } from '../../domain/errors'
import { isAgencyManager } from '../../domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import { EmailConfirmationRequiredError, UserNotFoundError } from '../../domain/errors'
import { toAuthenticatedUser } from '../../domain/user.entity'
import type { UserRepository } from '../ports/user-repository.port'

export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateUserInput): Promise<UpdateUserOutput> {
    const isSelfUpdate = input.actorId === input.userId

    if (!isSelfUpdate && !isAgencyManager(input.actorPapel)) {
      throw new ForbiddenError('Apenas a gestão da imobiliária pode editar usuários.')
    }

    const target = await this.userRepository.findById(input.userId)

    if (!target || target.tenantId !== input.actorTenantId) {
      throw new UserNotFoundError()
    }

    if (input.avatarUrl !== undefined) {
      if (!isSelfUpdate)
        throw new ForbiddenError('O avatar só pode ser alterado pelo próprio usuário.')
      if (!target.ativo) throw new AccountDeactivatedError()
      assertAvatarScope(
        input.avatarUrl,
        input.actorTenantId,
        input.actorId,
        target.avatarUrl ?? null,
      )
    }

    if (isSelfUpdate && input.papel !== undefined) {
      throw new ForbiddenError('O próprio usuário não pode alterar seu papel.')
    }

    if (input.email && input.email.trim().toLowerCase() !== target.email.toLowerCase()) {
      throw new EmailConfirmationRequiredError()
    }

    const updated = await this.userRepository.update(input.userId, {
      nome: input.nome,
      tenantId: input.actorTenantId,
      auditActor: { kind: 'USER', id: input.actorId },
      telefone: input.telefone,
      creci: input.creci,
      avatarUrl: input.avatarUrl,
      papel: input.papel,
    })

    return toAuthenticatedUser(updated)
  }
}
