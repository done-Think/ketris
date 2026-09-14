import type { NextRequest } from 'next/server'

import { UnauthorizedError } from '@server/shared/errors'

import type {
  PlatformAccessTokenPayload,
  PlatformTokenService,
} from './application/ports/platform-token-service.port'

export async function requirePlatformBearerAuth(
  request: NextRequest,
  tokenService: PlatformTokenService,
): Promise<PlatformAccessTokenPayload> {
  const header = request.headers.get('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : null

  if (!token) {
    throw new UnauthorizedError()
  }

  try {
    return await tokenService.verify(token)
  } catch {
    throw new UnauthorizedError()
  }
}
