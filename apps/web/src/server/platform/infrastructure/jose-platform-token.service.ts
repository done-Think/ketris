import { jwtVerify, SignJWT } from 'jose'

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
    const { payload } = await jwtVerify(token, getSecretKey())

    if (payload.scope !== 'platform') {
      throw new Error('Token não é um token de platform admin.')
    }

    return {
      sub: String(payload.sub),
      scope: 'platform',
    }
  }
}
