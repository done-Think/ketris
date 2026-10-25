import { jwtVerify, SignJWT } from 'jose'

import { passwordResetTokenClaimsSchema } from '../schemas/password-reset-token.schema'
import type { PasswordResetClaims } from '../types/password-reset'

import { PASSWORD_RESET_TOKEN_TTL_MINUTES } from '../domain/password-reset-code'
import { InvalidPasswordResetTokenError } from '../domain/errors'
import type { PasswordResetTokenService } from '../application/ports/password-reset-token.port'

const PASSWORD_RESET_TOKEN_PURPOSE = 'password-reset'

function getSecretKey(): Uint8Array {
  const secret = process.env.PASSWORD_RESET_TOKEN_SECRET

  if (!secret) {
    throw new Error(
      'PASSWORD_RESET_TOKEN_SECRET não configurado. Defina em apps/web/.env (ver .env.example).',
    )
  }

  return new TextEncoder().encode(secret)
}

export class JosePasswordResetTokenService implements PasswordResetTokenService {
  async issue(userId: string, sessionVersion: number): Promise<string> {
    return new SignJWT({ purpose: PASSWORD_RESET_TOKEN_PURPOSE, sessionVersion })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime(`${PASSWORD_RESET_TOKEN_TTL_MINUTES}m`)
      .sign(getSecretKey())
  }

  async verify(token: string): Promise<PasswordResetClaims> {
    try {
      const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ['HS256'] })

      const claims = passwordResetTokenClaimsSchema.parse(payload)
      return { userId: claims.sub, sessionVersion: claims.sessionVersion }
    } catch {
      throw new InvalidPasswordResetTokenError()
    }
  }
}
