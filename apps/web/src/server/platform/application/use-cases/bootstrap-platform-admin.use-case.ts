import type { PasswordHasher } from '@server/auth/application/ports/password-hasher.port'

import {
  PlatformAdminEmailAlreadyInUseError,
  PlatformAlreadyBootstrappedError,
} from '../../domain/errors'
import {
  toAuthenticatedPlatformAdmin,
  type AuthenticatedPlatformAdmin,
} from '../../domain/platform-admin.entity'
import type { PlatformBootstrapRepository } from '../ports/platform-bootstrap-repository.port'

export interface BootstrapPlatformAdminInput {
  nome: string
  email: string
  password: string
}

export type BootstrapPlatformAdminOutput = AuthenticatedPlatformAdmin

export class BootstrapPlatformAdminUseCase {
  constructor(
    private readonly bootstrapRepository: PlatformBootstrapRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: BootstrapPlatformAdminInput): Promise<BootstrapPlatformAdminOutput> {
    const senhaHash = await this.passwordHasher.hash(input.password)

    const result = await this.bootstrapRepository.bootstrapFirstPlatformAdmin({
      nome: input.nome,
      email: input.email,
      senhaHash,
    })

    if (result.status === 'already_bootstrapped') {
      throw new PlatformAlreadyBootstrappedError()
    }

    if (result.status === 'email_already_in_use') {
      throw new PlatformAdminEmailAlreadyInUseError()
    }

    return toAuthenticatedPlatformAdmin(result.admin)
  }
}
