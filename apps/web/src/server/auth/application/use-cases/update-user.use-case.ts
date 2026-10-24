import { assertAvatarScope } from '../../domain/avatar-policy'
import { AccountDeactivatedError } from '../../domain/errors'
import { isAgencyManager } from '../../domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import { EmailAlreadyInUseError, UserNotFoundError } from '../../domain/errors'
import {
  toAuthenticatedUser,
  type AuthenticatedUser,
  type TenantMemberPapel,
  type Papel,
} from '../../domain/user.entity'
import type { UserRepository } from '../ports/user-repository.port'

export interface UpdateUserInput {
  actorId: string
  actorTenantId: string
  actorPapel: Papel
  userId: string
  nome?: string
  email?: string
  avatarUrl?: string | null
  papel?: TenantMemberPapel
}

export type UpdateUserOutput = AuthenticatedUser

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
      throw new ForbiddenError('Self updates cannot change roles.')
    }

    if (input.email && input.email !== target.email) {
      const existing = await this.userRepository.findByEmail(input.email)

      if (existing) {
        throw new EmailAlreadyInUseError()
      }
    }

    const updated = await this.userRepository.update(input.userId, {
      nome: input.nome,
      email: input.email,
      avatarUrl: input.avatarUrl,
      papel: input.papel,
    })

    return toAuthenticatedUser(updated)
  }
}
