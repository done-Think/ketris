import { jwtVerify, SignJWT } from 'jose'

import type { AuthenticatedUser } from '../domain/user.entity'
import type { AccessTokenPayload, TokenService } from '../application/ports/token-service.port'

const ACCESS_TOKEN_TTL = '1h'

// Token de acesso de aplicação (usado pelo HttpClient do frontend como Bearer) — deliberadamente separado
// da própria sessão JWE do NextAuth (NEXTAUTH_SECRET), para não acoplar os dois mecanismos (ver ADR-0002).
function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_TOKEN_SECRET

  if (!secret) {
    throw new Error(
      'AUTH_TOKEN_SECRET não configurado. Defina em apps/web/.env (ver .env.example).',
    )
  }

  return new TextEncoder().encode(secret)
}

export class JoseTokenService implements TokenService {
  async sign(user: AuthenticatedUser): Promise<string> {
    return new SignJWT({ tenantId: user.tenantId, papel: user.papel })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(ACCESS_TOKEN_TTL)
      .sign(getSecretKey())
  }

  async verify(token: string): Promise<AccessTokenPayload> {
    const { payload } = await jwtVerify(token, getSecretKey())

    return {
      sub: String(payload.sub),
      tenantId: String(payload.tenantId),
      papel: String(payload.papel),
    }
  }
}
