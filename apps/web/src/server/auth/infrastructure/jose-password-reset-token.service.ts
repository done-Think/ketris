import { jwtVerify, SignJWT } from 'jose'

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
  async issue(userId: string): Promise<string> {
    return new SignJWT({ purpose: PASSWORD_RESET_TOKEN_PURPOSE })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime(`${PASSWORD_RESET_TOKEN_TTL_MINUTES}m`)
      .sign(getSecretKey())
  }

  async verify(token: string): Promise<string> {
    try {
      const { payload } = await jwtVerify(token, getSecretKey())

      if (payload.purpose !== PASSWORD_RESET_TOKEN_PURPOSE || !payload.sub) {
        throw new InvalidPasswordResetTokenError()
      }

      return payload.sub
    } catch {
      throw new InvalidPasswordResetTokenError()
    }
  }
}
