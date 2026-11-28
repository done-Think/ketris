import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto'
import { getInstagramConfig } from '../config'
import { InstagramError } from '../domain/errors'
import type { InstagramTokenVault } from '../application/ports/instagram-api.port'

export function digest(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

export class EncryptedInstagramTokenVault implements InstagramTokenVault {
  random() {
    return randomBytes(32).toString('base64url')
  }
  digest(value: string) {
    return digest(value)
  }
  encrypt(token: string, context: string) {
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', getInstagramConfig().encryptionKey, iv)
    cipher.setAAD(Buffer.from(`instagram:${context}:v2`))
    const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
    return [
      'v2',
      iv.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      encrypted.toString('base64url'),
    ].join('.')
  }
  decrypt(value: string, context: string) {
    try {
      const [version, iv, tag, ciphertext, extra] = value.split('.')
      if (version !== 'v2' || !iv || !tag || !ciphertext || extra !== undefined) throw new Error()
      for (const part of [iv, tag, ciphertext]) {
        if (Buffer.from(part, 'base64url').toString('base64url') !== part) throw new Error()
      }
      const decipher = createDecipheriv(
        'aes-256-gcm',
        getInstagramConfig().encryptionKey,
        Buffer.from(iv, 'base64url'),
      )
      decipher.setAAD(Buffer.from(`instagram:${context}:v2`))
      decipher.setAuthTag(Buffer.from(tag, 'base64url'))
      return Buffer.concat([
        decipher.update(Buffer.from(ciphertext, 'base64url')),
        decipher.final(),
      ]).toString('utf8')
    } catch {
      throw new InstagramError(
        'INSTAGRAM_TOKEN_UNAVAILABLE',
        'Reconecte sua conta do Instagram.',
        409,
      )
    }
  }
}

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left),
    b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function mediaSignature(path: string) {
  return createHmac('sha256', getInstagramConfig().encryptionKey)
    .update(`instagram-media:${path}`)
    .digest('base64url')
}
