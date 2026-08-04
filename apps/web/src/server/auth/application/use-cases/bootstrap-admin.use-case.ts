import {
  AdminAlreadyExistsError,
  EmailAlreadyInUseError,
  TenantNotFoundError,
} from '../../domain/errors'
import { toAuthenticatedUser, type AuthenticatedUser } from '../../domain/user.entity'
import type { BootstrapAdminRepository } from '../ports/bootstrap-admin-repository.port'
import type { PasswordHasher } from '../ports/password-hasher.port'

export interface BootstrapAdminInput {
  tenantSlug: string
  nome: string
  email: string
  password: string
}

export type BootstrapAdminOutput = AuthenticatedUser

export class BootstrapAdminUseCase {
  constructor(
    private readonly bootstrapAdminRepository: BootstrapAdminRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: BootstrapAdminInput): Promise<BootstrapAdminOutput> {
    const senhaHash = await this.passwordHasher.hash(input.password)

    const result = await this.bootstrapAdminRepository.bootstrapFirstAdmin({
      tenantSlug: input.tenantSlug,
      nome: input.nome,
      email: input.email,
      senhaHash,
    })

    if (result.status === 'tenant_not_found') {
      throw new TenantNotFoundError()
    }

    if (result.status === 'admin_already_exists') {
      throw new AdminAlreadyExistsError()
    }

    if (result.status === 'email_already_in_use') {
      throw new EmailAlreadyInUseError()
    }

    return toAuthenticatedUser(result.user)
  }
}
