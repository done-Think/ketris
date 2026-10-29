import type { NextRequest } from 'next/server'

import { AppError, UnauthorizedError } from '@server/shared/errors'
import { isAuthenticationError } from '@server/security/authentication-errors'

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
  } catch (error) {
    if (isAuthenticationError(error)) {
      if (error instanceof AppError) throw error
      throw new UnauthorizedError()
    }
    throw error
  }
}
