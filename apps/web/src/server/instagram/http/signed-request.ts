import { createHmac } from 'node:crypto'
import { z } from 'zod'
import { getInstagramConfig } from '../config'
import { InstagramError } from '../domain/errors'
import { safeEqual } from '../infrastructure/token-vault'
import { parseMetaJson } from '../infrastructure/meta-json'

export function verifyInstagramSignedRequest(value: string) {
  try {
    const [signature, payload, extra] = value.split('.')
    if (!signature || !payload || extra) throw new Error()
    const expected = createHmac('sha256', getInstagramConfig().appSecret)
      .update(payload)
      .digest('base64url')
    if (!safeEqual(signature, expected)) throw new Error()
    const result = z
      .object({
        algorithm: z.literal('HMAC-SHA256'),
        user_id: z.union([z.string(), z.number()]).transform(String),
        issued_at: z.number(),
      })
      .safeParse(parseMetaJson(Buffer.from(payload, 'base64url').toString('utf8')))
    if (!result.success || Math.abs(Date.now() / 1000 - result.data.issued_at) > 86400)
      throw new Error()
    return result.data.user_id
  } catch {
    throw new InstagramError('INSTAGRAM_INVALID_SIGNATURE', 'Assinatura inválida.', 401)
  }
}

export function deletionReceipt(code: string, completedAt: string) {
  const payload = Buffer.from(JSON.stringify({ code, completedAt })).toString('base64url')
  return `${payload}.${createHmac('sha256', getInstagramConfig().appSecret).update(`deletion:${payload}`).digest('base64url')}`
}

export function verifyDeletionReceipt(value: string) {
  try {
    const [payload, signature] = value.split('.')
    const expected = createHmac('sha256', getInstagramConfig().appSecret)
      .update(`deletion:${payload}`)
      .digest('base64url')
    if (!signature || !safeEqual(signature, expected)) throw new Error()
    return z
      .object({ code: z.string().uuid(), completedAt: z.string().datetime() })
      .parse(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')))
  } catch {
    throw new InstagramError('INSTAGRAM_INVALID_RECEIPT', 'Comprovante inválido.', 404)
  }
}
