import { SignJWT, jwtVerify, errors } from 'jose'
import { z } from 'zod'
import { AppError } from '@server/shared/errors'
import type { ContractDocumentUploadTickets } from '../application/ports/contract-document-storage.port'
import type { ContractDocumentDescriptor } from '../types/documents'
import { contractDocumentDescriptorSchema } from '../schemas/contract-document.schema'
import { CONTRACT_DOCUMENT_UPLOAD_TTL_SECONDS } from '../config/document-limits'

const issuer = 'ketris:contracts:document-upload'
const audience = 'ketris:contracts'
const claimsSchema = z
  .object({
    purpose: z.literal('contract-document-upload'),
    descriptor: contractDocumentDescriptorSchema,
    sub: z.string().min(1),
    iss: z.literal(issuer),
    aud: z.literal(audience),
    iat: z.number().int(),
    exp: z.number().int(),
  })
  .strict()

export class JoseContractUploadTickets implements ContractDocumentUploadTickets {
  private key() {
    const secret = process.env.AUTH_TOKEN_SECRET
    if (!secret)
      throw new AppError('Serviço de documentos indisponível.', {
        status: 503,
        code: 'CONTRACT_DOCUMENT_STORAGE_UNAVAILABLE',
      })
    return new TextEncoder().encode(secret)
  }

  async issue(descriptor: ContractDocumentDescriptor) {
    const data = contractDocumentDescriptorSchema.parse(descriptor)
    return new SignJWT({ purpose: 'contract-document-upload', descriptor: data })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(descriptor.actorId)
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + CONTRACT_DOCUMENT_UPLOAD_TTL_SECONDS)
      .sign(this.key())
  }

  async verify(token: string): Promise<ContractDocumentDescriptor> {
    const key = this.key()
    try {
      const { payload } = await jwtVerify(token, key, { issuer, audience, algorithms: ['HS256'] })
      const claims = claimsSchema.parse(payload)
      if (claims.sub !== claims.descriptor.actorId) throw new Error('Invalid upload owner')
      return claims.descriptor
    } catch (error) {
      if (error instanceof errors.JWTExpired)
        throw new AppError('A autorização de envio expirou. Inicie o envio novamente.', {
          status: 409,
          code: 'CONTRACT_UPLOAD_EXPIRED',
        })
      throw new AppError('Autorização de envio inválida.', {
        status: 400,
        code: 'CONTRACT_UPLOAD_INVALID',
      })
    }
  }
}
