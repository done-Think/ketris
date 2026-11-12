import { postalCodeResponseSchema } from '../schemas/postal-code-schema'
import type { PostalCodeAddress } from '../types/postal-code'
import { isValidPostalCode, normalizePostalCode } from '@shared/utils/postal-code'

const cache = new Map<string, { address: PostalCodeAddress | null; expiresAt: number }>()

export async function lookupPostalCode(
  zipCode: string,
  signal: AbortSignal,
): Promise<PostalCodeAddress | null> {
  const digits = normalizePostalCode(zipCode)
  if (!digits || !isValidPostalCode(digits)) return null
  const cached = cache.get(digits)
  if (cached && cached.expiresAt > Date.now()) return cached.address
  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal })
  if (!response.ok) throw new Error('Postal code service unavailable.')
  const data = postalCodeResponseSchema.parse(await response.json())
  const address =
    'erro' in data
      ? null
      : {
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
        }
  if (cache.size >= 32) cache.delete(cache.keys().next().value!)
  cache.set(digits, { address, expiresAt: Date.now() + (address ? 3600000 : 900000) })
  return address
}

export function isPostalCodeNotFound(zipCode: string): boolean {
  const digits = normalizePostalCode(zipCode)
  if (!digits) return false
  const cached = cache.get(digits)
  return Boolean(cached && cached.expiresAt > Date.now() && cached.address === null)
}
