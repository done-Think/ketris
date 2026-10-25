import { jwtVerify, SignJWT } from 'jose'
import { UnauthorizedError } from '@server/shared/errors'

import type { AuthenticatedPlatformAdmin } from '../domain/platform-admin.entity'
import type {
  PlatformAccessTokenPayload,
  PlatformTokenService,
} from '../application/ports/platform-token-service.port'

const ACCESS_TOKEN_TTL = '1h'

function getSecretKey(): Uint8Array {
  const secret = process.env.PLATFORM_TOKEN_SECRET

  if (!secret) {
    throw new Error(
      'PLATFORM_TOKEN_SECRET não configurado. Defina em apps/web/.env (ver .env.example).',
    )
  }

  return new TextEncoder().encode(secret)
}

export class JosePlatformTokenService implements PlatformTokenService {
  async sign(admin: AuthenticatedPlatformAdmin): Promise<string> {
    return new SignJWT({ scope: 'platform' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(admin.id)
      .setIssuedAt()
      .setExpirationTime(ACCESS_TOKEN_TTL)
      .sign(getSecretKey())
  }

  async verify(token: string): Promise<PlatformAccessTokenPayload> {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ['HS256'] })

    if (payload.scope !== 'platform' || typeof payload.sub !== 'string' || !payload.sub.trim()) {
      throw new UnauthorizedError()
    }

    return {
      sub: String(payload.sub),
      scope: 'platform',
    }
  }
}
