import { EmailAlreadyInUseError } from '@server/auth/domain/errors'
import type { PasswordHasher } from '@server/auth/application/ports/password-hasher.port'
import type { UserRepository } from '@server/auth/application/ports/user-repository.port'
import type { TenantRepository } from '@server/platform/application/ports/tenant-repository.port'

import { AgencyNotFoundError } from '../../domain/errors'

export interface RegisterTenantAgentInput {
  agencyId: string
  fullName: string
  email: string
  password: string
}

export interface RegisterTenantAgentOutput {
  email: string
}

export class RegisterTenantAgentUseCase {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: RegisterTenantAgentInput): Promise<RegisterTenantAgentOutput> {
    const agency = await this.tenantRepository.findById(input.agencyId)

    if (!agency) {
      throw new AgencyNotFoundError()
    }

    const existing = await this.userRepository.findByEmailAndTenant(agency.id, input.email)

    if (existing) {
      throw new EmailAlreadyInUseError()
    }

    const senhaHash = await this.passwordHasher.hash(input.password)

    const created = await this.userRepository.create({
      tenantId: agency.id,
      nome: input.fullName,
      email: input.email,
      senhaHash,
      papel: 'AGENT',
      vinculoAprovadoEm: null,
    })

    return { email: created.email }
  }
}
