import { ForbiddenError } from '@server/shared/errors'

import { EmailAlreadyInUseError, UserNotFoundError } from '../../domain/errors'
import {
  toAuthenticatedUser,
  type AuthenticatedUser,
  type NonAdminPapel,
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
  papel?: NonAdminPapel
}

export type UpdateUserOutput = AuthenticatedUser

export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateUserInput): Promise<UpdateUserOutput> {
    const isSelfUpdate = input.actorId === input.userId

    if (!isSelfUpdate && input.actorPapel !== 'ADMIN') {
      throw new ForbiddenError('Apenas administradores podem editar usuários.')
    }

    const target = await this.userRepository.findById(input.userId)

    if (
      !target ||
      target.tenantId !== input.actorTenantId ||
      (target.papel === 'ADMIN' && !isSelfUpdate)
    ) {
      throw new UserNotFoundError()
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
