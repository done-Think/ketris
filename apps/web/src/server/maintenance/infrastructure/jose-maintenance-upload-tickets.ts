import { AppError } from '@server/shared/errors'
import { SignJWT, errors, jwtVerify } from 'jose'
import { z } from 'zod'
import type { MaintenanceUploadTickets } from '../application/ports/maintenance-direct-upload.port'
import { MAINTENANCE_ATTACHMENT_UPLOAD_TTL_SECONDS } from '../config/attachment-limits'
import { maintenanceUploadDescriptorSchema } from '../schemas/maintenance-upload.schema'
import type { MaintenanceUploadDescriptor } from '../types/maintenance-upload'

const issuer = 'ketris:maintenance:attachment-upload'
const audience = 'ketris:maintenance'
const claimsSchema = z
  .object({
    purpose: z.literal('maintenance-attachment-upload'),
    descriptor: maintenanceUploadDescriptorSchema,
    sub: z.string().min(1),
    iss: z.literal(issuer),
    aud: z.literal(audience),
    iat: z.number().int(),
    exp: z.number().int(),
  })
  .strict()

export class JoseMaintenanceUploadTickets implements MaintenanceUploadTickets {
  private key() {
    const secret = process.env.AUTH_TOKEN_SECRET
    if (!secret)
      throw new AppError('Serviço de anexos indisponível.', {
        status: 503,
        code: 'MAINTENANCE_STORAGE_UNAVAILABLE',
      })
    return new TextEncoder().encode(secret)
  }
  issue(descriptor: MaintenanceUploadDescriptor) {
    const data = maintenanceUploadDescriptorSchema.parse(descriptor)
    return new SignJWT({ purpose: 'maintenance-attachment-upload', descriptor: data })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(data.actorId)
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + MAINTENANCE_ATTACHMENT_UPLOAD_TTL_SECONDS)
      .sign(this.key())
  }
  async verify(token: string): Promise<MaintenanceUploadDescriptor> {
    const key = this.key()
    try {
      const { payload } = await jwtVerify(token, key, { issuer, audience, algorithms: ['HS256'] })
      const claims = claimsSchema.parse(payload)
      if (claims.sub !== claims.descriptor.actorId) throw new Error('Invalid upload owner')
      return claims.descriptor
    } catch (error) {
      if (error instanceof errors.JWTExpired)
        throw new AppError('A autorização de envio expirou. Envie o arquivo novamente.', {
          status: 409,
          code: 'MAINTENANCE_UPLOAD_EXPIRED',
        })
      throw new AppError('Autorização de envio inválida.', {
        status: 400,
        code: 'MAINTENANCE_UPLOAD_INVALID',
      })
    }
  }
}
