import { z } from 'zod'
import { normalizeEmail } from '@server/shared/normalize-email'

export function faceCheckContactEmail(contact: string | null): string | null {
  const email = normalizeEmail(contact ?? '')
  return z.string().email().safeParse(email).success ? email : null
}
