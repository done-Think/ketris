import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { FaceCheckError } from '../http/errors'

export function captureTokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export class DataCipher {
  constructor(private readonly key: Buffer) {
    if (key.length !== 32) throw new FaceCheckError('STORAGE_UNAVAILABLE', 503)
  }

  static fromEnvironment() {
    const value = process.env.FACE_CHECK_DATA_ENCRYPTION_KEY ?? ''
    const key = Buffer.from(value, 'base64')
    if (key.length !== 32 || key.toString('base64') !== value)
      throw new FaceCheckError('STORAGE_UNAVAILABLE', 503)
    return new DataCipher(key)
  }

  encrypt(value: unknown, context: string): string {
    const nonce = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', this.key, nonce)
    cipher.setAAD(Buffer.from(`face_check:v1:${context}`))
    const bytes = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()])
    return [
      'v1',
      nonce.toString('base64'),
      cipher.getAuthTag().toString('base64'),
      bytes.toString('base64'),
    ].join('.')
  }

  decrypt<T>(value: string, context: string): T {
    try {
      const [version, nonce, tag, body, extra] = value.split('.')
      if (version !== 'v1' || extra || !nonce || !tag || !body)
        throw new Error('INVALID_CIPHERTEXT')
      const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(nonce, 'base64'))
      decipher.setAAD(Buffer.from(`face_check:v1:${context}`))
      decipher.setAuthTag(Buffer.from(tag, 'base64'))
      return JSON.parse(
        Buffer.concat([decipher.update(Buffer.from(body, 'base64')), decipher.final()]).toString(),
      ) as T
    } catch {
      throw new FaceCheckError('STORAGE_UNAVAILABLE', 503)
    }
  }
}
