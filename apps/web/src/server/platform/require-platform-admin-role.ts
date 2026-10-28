import type { NextRequest } from 'next/server'

import { ForbiddenError, UnauthorizedError } from '@server/shared/errors'

import type { PlatformAdminRepository } from './application/ports/platform-admin-repository.port'
import type { PlatformTokenService } from './application/ports/platform-token-service.port'
import type { PlatformAdmin, PlatformAdminRole } from './types/platform-admin'
import { requirePlatformBearerAuth } from './require-platform-bearer-auth'

export const BILLING_EDITOR_ROLES: readonly PlatformAdminRole[] = ['ADMIN']

export const PLATFORM_MANAGER_ROLES: readonly PlatformAdminRole[] = ['ADMIN']

export async function requirePlatformAdminRole(
  request: NextRequest,
  tokenService: PlatformTokenService,
  platformAdminRepository: PlatformAdminRepository,
  allowedRoles: readonly PlatformAdminRole[],
): Promise<PlatformAdmin> {
  const { sub } = await requirePlatformBearerAuth(request, tokenService)
  const admin = await platformAdminRepository.findById(sub)

  if (!admin || !admin.active) {
    throw new UnauthorizedError()
  }

  if (!allowedRoles.includes(admin.role)) {
    throw new ForbiddenError()
  }

  return admin
}
