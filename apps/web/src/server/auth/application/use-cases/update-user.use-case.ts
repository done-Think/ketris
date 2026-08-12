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
  actorTenantId: string
  actorPapel: Papel
  userId: string
  nome?: string
  email?: string
  papel?: NonAdminPapel
}

export type UpdateUserOutput = AuthenticatedUser

export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateUserInput): Promise<UpdateUserOutput> {
    if (input.actorPapel !== 'ADMIN') {
      throw new ForbiddenError('Apenas administradores podem editar usuários.')
    }

    const target = await this.userRepository.findById(input.userId)

    if (!target || target.tenantId !== input.actorTenantId || target.papel === 'ADMIN') {
      throw new UserNotFoundError()
    }

    if (input.email && input.email !== target.email) {
      const existing = await this.userRepository.findByEmailAndTenant(
        input.actorTenantId,
        input.email,
      )

      if (existing) {
        throw new EmailAlreadyInUseError()
      }
    }

    const updated = await this.userRepository.update(input.userId, {
      nome: input.nome,
      email: input.email,
      papel: input.papel,
    })

    return toAuthenticatedUser(updated)
  }
}
