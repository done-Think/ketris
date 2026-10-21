import type { NextRequest } from 'next/server'

import { ForbiddenError, UnauthorizedError } from '@server/shared/errors'

import type { PlatformAdminRepository } from './application/ports/platform-admin-repository.port'
import type { PlatformTokenService } from './application/ports/platform-token-service.port'
import type { PlatformAdmin, PlatformAdminRole } from './domain/platform-admin.entity'
import { requirePlatformBearerAuth } from './require-platform-bearer-auth'

// Platform changes that affect billing (plan prices, tenant account type and status).
export const BILLING_EDITOR_ROLES: readonly PlatformAdminRole[] = ['ADMIN']

// The access token only carries the admin id, so the role is read from the database: a role
// change or a deactivation applies right away instead of when the token expires.
export async function requirePlatformAdminRole(
  request: NextRequest,
  tokenService: PlatformTokenService,
  platformAdminRepository: PlatformAdminRepository,
  allowedRoles: readonly PlatformAdminRole[],
): Promise<PlatformAdmin> {
  const { sub } = await requirePlatformBearerAuth(request, tokenService)
  const admin = await platformAdminRepository.findById(sub)

  if (!admin || !admin.ativo) {
    throw new UnauthorizedError()
  }

  if (!allowedRoles.includes(admin.role)) {
    throw new ForbiddenError()
  }

  return admin
}
