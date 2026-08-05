import { ForbiddenError } from '@server/shared/errors'

import { EmailAlreadyInUseError, UserNotFoundError } from '../../domain/errors'
import { toAuthenticatedUser, type AuthenticatedUser, type Papel } from '../../domain/user.entity'
import type { UserRepository } from '../ports/user-repository.port'

export interface UpdateAdminInput {
  actorTenantId: string
  actorPapel: Papel
  adminId: string
  nome?: string
  email?: string
}

export type UpdateAdminOutput = AuthenticatedUser

export class UpdateAdminUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateAdminInput): Promise<UpdateAdminOutput> {
    if (input.actorPapel !== 'ADMIN') {
      throw new ForbiddenError('Apenas administradores podem editar administradores.')
    }

    const target = await this.userRepository.findById(input.adminId)

    if (!target || target.tenantId !== input.actorTenantId || target.papel !== 'ADMIN') {
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

    const updated = await this.userRepository.update(input.adminId, {
      nome: input.nome,
      email: input.email,
    })

    return toAuthenticatedUser(updated)
  }
}
