import type { NextRequest } from 'next/server'

import { UnauthorizedError } from '@server/shared/errors'

import type { AccessTokenPayload, TokenService } from './application/ports/token-service.port'

export async function requireBearerAuth(
  request: NextRequest,
  tokenService: TokenService,
): Promise<AccessTokenPayload> {
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
