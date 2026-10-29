import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { AppError } from '@server/shared/errors'
import type { ContractDataProtector } from '../application/ports/contract-data-protector.port'
import type { ContractCpfContext } from '../types/data-protection'

function unavailable() {
  return new AppError('Não foi possível acessar a proteção dos dados do contrato.', {
    status: 503,
    code: 'CONTRACT_DATA_PROTECTION_UNAVAILABLE',
  })
}

function associatedData(context: ContractCpfContext) {
  return Buffer.from(JSON.stringify(['contracts-cpf', context.tenantId, context.partyId]))
}

export function isProtectedContractCpf(value: string) {
  return value.startsWith('enc:')
}

export class AesContractDataProtector implements ContractDataProtector {
  constructor(private readonly configuredKey?: string) {}

  validateConfiguration(): void {
    this.key()
  }

  private key() {
    const value = this.configuredKey ?? process.env.CONTRACTS_DATA_ENCRYPTION_KEY
    if (!value || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw unavailable()
    const key = Buffer.from(value, 'base64')
    if (key.length !== 32) throw unavailable()
    return key
  }

  encryptCpf(value: string, context: ContractCpfContext): string {
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv)
    cipher.setAAD(associatedData(context))
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
    return [
      'enc',
      'v1',
      iv.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      encrypted.toString('base64url'),
    ].join(':')
  }

  decryptCpf(value: string, context: ContractCpfContext): string {
    if (!isProtectedContractCpf(value)) return value
    try {
      const parts = value.split(':')
      if (parts.length !== 5 || parts[1] !== 'v1') throw unavailable()
      const iv = Buffer.from(parts[2], 'base64url')
      const tag = Buffer.from(parts[3], 'base64url')
      if (iv.length !== 12 || tag.length !== 16) throw unavailable()
      const decipher = createDecipheriv('aes-256-gcm', this.key(), iv)
      decipher.setAAD(associatedData(context))
      decipher.setAuthTag(tag)
      return Buffer.concat([
        decipher.update(Buffer.from(parts[4], 'base64url')),
        decipher.final(),
      ]).toString('utf8')
    } catch {
      throw unavailable()
    }
  }
}
