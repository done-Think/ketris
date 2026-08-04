import { ForbiddenError } from '@server/shared/errors'

import { EmailAlreadyInUseError } from '../../domain/errors'
import { toAuthenticatedUser, type AuthenticatedUser, type Papel } from '../../domain/user.entity'
import type { PasswordHasher } from '../ports/password-hasher.port'
import type { UserRepository } from '../ports/user-repository.port'

export interface CreateUserInput {
  actorTenantId: string
  actorPapel: Papel
  nome: string
  email: string
  password: string
  papel: Papel
}

export type CreateUserOutput = AuthenticatedUser

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    if (input.actorPapel !== 'ADMIN') {
      throw new ForbiddenError('Apenas administradores podem criar usuários.')
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
      papel: input.papel,
    })

    return toAuthenticatedUser(created)
  }
}
