import type { CreateUserOutput } from '../../types/use-case-outputs'
import type { CreateUserInput } from '../../types/use-case-inputs'
import { isAgencyManager } from '../../domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import { EmailAlreadyInUseError } from '../../domain/errors'
import { toAuthenticatedUser } from '../../domain/user.entity'
import type { PasswordHasher } from '../ports/password-hasher.port'
import type { UserRepository } from '../ports/user-repository.port'

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    if (!isAgencyManager(input.actorPapel)) {
      throw new ForbiddenError('Apenas a gestão da imobiliária pode criar usuários.')
    }

    const existing = await this.userRepository.findByEmail(input.email, input.actorTenantId)

    if (existing) {
      throw new EmailAlreadyInUseError()
    }

    const senhaHash = await this.passwordHasher.hash(input.password)

    const created = await this.userRepository.create({
      tenantId: input.actorTenantId,
      auditActor: { kind: 'USER', id: input.actorId },
      nome: input.nome,
      email: input.email,
      senhaHash,
      papel: input.papel,
    })

    return toAuthenticatedUser(created)
  }
}
