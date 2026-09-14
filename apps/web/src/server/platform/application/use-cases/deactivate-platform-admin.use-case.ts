import { CannotDeactivateSelfError, PlatformAdminNotFoundError } from '../../domain/errors'
import {
  toAuthenticatedPlatformAdmin,
  type AuthenticatedPlatformAdmin,
} from '../../domain/platform-admin.entity'
import type { PlatformAdminRepository } from '../ports/platform-admin-repository.port'
import type { PlatformRefreshTokenRepository } from '../ports/platform-refresh-token-repository.port'

export interface DeactivatePlatformAdminInput {
  actorId: string
  platformAdminId: string
}

export type DeactivatePlatformAdminOutput = AuthenticatedPlatformAdmin

export class DeactivatePlatformAdminUseCase {
  constructor(
    private readonly platformAdminRepository: PlatformAdminRepository,
    private readonly refreshTokenRepository: PlatformRefreshTokenRepository,
  ) {}

  async execute(input: DeactivatePlatformAdminInput): Promise<DeactivatePlatformAdminOutput> {
    if (input.actorId === input.platformAdminId) {
      throw new CannotDeactivateSelfError()
    }

    const target = await this.platformAdminRepository.findById(input.platformAdminId)

    if (!target) {
      throw new PlatformAdminNotFoundError()
    }

    const deactivated = await this.platformAdminRepository.deactivate(input.platformAdminId)
    await this.refreshTokenRepository.revokeAllForPlatformAdmin(input.platformAdminId)

    return toAuthenticatedPlatformAdmin(deactivated)
  }
}
