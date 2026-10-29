import type { CreateUserOutput } from '../../types/use-case-outputs'
import type { CreateUserInput } from '../../types/use-case-inputs'
import { isAgencyManager } from '../../domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import { EmailAlreadyInUseError } from '../../domain/errors'
import { toAuthenticatedUser } from '../authenticated-user'
import type { PasswordHasher } from '../ports/password-hasher.port'
import type { UserRepository } from '../ports/user-repository.port'

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    if (!isAgencyManager(input.actorRole)) {
      throw new ForbiddenError('Apenas a gestão da imobiliária pode criar usuários.')
    }

    const existing = await this.userRepository.findByEmail(input.email, input.actorTenantId)

    if (existing) {
      throw new EmailAlreadyInUseError()
    }

    const passwordHash = await this.passwordHasher.hash(input.password)

    const created = await this.userRepository.create({
      tenantId: input.actorTenantId,
      auditActor: { kind: 'USER', id: input.actorId },
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    })

    return toAuthenticatedUser(created)
  }
}
