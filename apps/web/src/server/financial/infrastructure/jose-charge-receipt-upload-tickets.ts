import { SignJWT, errors, jwtVerify } from 'jose'
import { z } from 'zod'

import type { ChargeReceiptUploadTickets } from '../application/ports/charge-receipt-storage.port'
import { CHARGE_RECEIPT_UPLOAD_TTL_SECONDS } from '../config/receipt-limits'
import {
  ChargeReceiptStorageUnavailableError,
  ChargeReceiptUploadExpiredError,
  ChargeReceiptUploadInvalidError,
} from '../domain/errors'
import { chargeReceiptDescriptorSchema } from '../schemas/charge-receipt.schema'
import type { ChargeReceiptDescriptor } from '../types/charge-receipt'

const issuer = 'ketris:financial:receipt-upload'
const audience = 'ketris:financial'
const purpose = 'charge-receipt-upload'
const claimsSchema = z
  .object({
    purpose: z.literal(purpose),
    descriptor: chargeReceiptDescriptorSchema,
    sub: z.string().min(1),
    iss: z.literal(issuer),
    aud: z.literal(audience),
    iat: z.number().int(),
    exp: z.number().int(),
  })
  .strict()

export class JoseChargeReceiptUploadTickets implements ChargeReceiptUploadTickets {
  private key() {
    const secret = process.env.AUTH_TOKEN_SECRET
    if (!secret) throw new ChargeReceiptStorageUnavailableError()
    return new TextEncoder().encode(secret)
  }

  async issue(descriptor: ChargeReceiptDescriptor) {
    const data = chargeReceiptDescriptorSchema.parse(descriptor)
    return new SignJWT({ purpose, descriptor: data })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(descriptor.actorId)
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + CHARGE_RECEIPT_UPLOAD_TTL_SECONDS)
      .sign(this.key())
  }

  async verify(token: string): Promise<ChargeReceiptDescriptor> {
    const key = this.key()
    try {
      const { payload } = await jwtVerify(token, key, { issuer, audience, algorithms: ['HS256'] })
      const claims = claimsSchema.parse(payload)
      if (claims.sub !== claims.descriptor.actorId) throw new ChargeReceiptUploadInvalidError()
      return claims.descriptor
    } catch (error) {
      if (error instanceof errors.JWTExpired) throw new ChargeReceiptUploadExpiredError()
      throw new ChargeReceiptUploadInvalidError()
    }
  }
}
