import { isAgencyManager } from '../../domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import { EmailAlreadyInUseError } from '../../domain/errors'
import {
  toAuthenticatedUser,
  type AuthenticatedUser,
  type TenantMemberPapel,
  type Papel,
} from '../../domain/user.entity'
import type { PasswordHasher } from '../ports/password-hasher.port'
import type { UserRepository } from '../ports/user-repository.port'

export interface CreateUserInput {
  actorTenantId: string
  actorPapel: Papel
  nome: string
  email: string
  password: string
  papel: TenantMemberPapel
}

export type CreateUserOutput = AuthenticatedUser

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    if (!isAgencyManager(input.actorPapel)) {
      throw new ForbiddenError('Apenas a gestão da imobiliária pode criar usuários.')
    }

    const existing = await this.userRepository.findByEmail(input.email)

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
