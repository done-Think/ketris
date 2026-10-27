import { EmailAlreadyInUseError } from '@server/auth/domain/errors'
import { toAuthenticatedUser } from '@server/auth/domain/user.entity'
import type { PasswordHasher } from '@server/auth/application/ports/password-hasher.port'
import type { UserRepository } from '@server/auth/application/ports/user-repository.port'

import { TenantNotFoundError } from '../../domain/errors'
import type { TenantRepository } from '../ports/tenant-repository.port'
import type { CreateTenantAdminInput, CreateTenantAdminOutput } from '../../types/use-case-inputs'

export class CreateTenantAdminUseCase {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateTenantAdminInput): Promise<CreateTenantAdminOutput> {
    const tenant = await this.tenantRepository.findById(input.tenantId)

    if (!tenant) {
      throw new TenantNotFoundError()
    }

    const existing = await this.userRepository.findByEmail(input.email, input.tenantId)

    if (existing) {
      throw new EmailAlreadyInUseError()
    }

    const senhaHash = await this.passwordHasher.hash(input.password)

    const created = await this.userRepository.create({
      tenantId: tenant.id,
      nome: input.nome,
      email: input.email,
      senhaHash,
      papel: 'OWNER',
      auditActor: input.actorId
        ? { kind: 'PLATFORM_ADMIN', id: input.actorId }
        : { kind: 'SYSTEM' },
    })

    return toAuthenticatedUser(created)
  }
}
