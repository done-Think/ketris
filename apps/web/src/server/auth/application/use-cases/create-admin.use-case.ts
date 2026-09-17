import { ForbiddenError } from '@server/shared/errors'

import { EmailAlreadyInUseError } from '../../domain/errors'
import { toAuthenticatedUser, type AuthenticatedUser, type Papel } from '../../domain/user.entity'
import type { PasswordHasher } from '../ports/password-hasher.port'
import type { UserRepository } from '../ports/user-repository.port'

export interface CreateAdminInput {
  actorTenantId: string
  actorPapel: Papel
  nome: string
  email: string
  password: string
}

export type CreateAdminOutput = AuthenticatedUser

export class CreateAdminUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateAdminInput): Promise<CreateAdminOutput> {
    if (input.actorPapel !== 'ADMIN') {
      throw new ForbiddenError('Apenas administradores podem criar outros administradores.')
    }

    const existing = await this.userRepository.findByEmailAndTenant(
      input.actorTenantId,
      input.email,
    )

    if (existing) {
      throw new EmailAlreadyInUseError()
    }

    const senhaHash = await this.passwordHasher.hash(input.password)

    const created = await this.userRepository.create({
      tenantId: input.actorTenantId,
      nome: input.nome,
      email: input.email,
      senhaHash,
      papel: 'ADMIN',
    })

    return toAuthenticatedUser(created)
  }
}
