import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function isValidCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false

  const checkDigit = (base: string) => {
    const weights =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const total = [...base].reduce((sum, char, index) => sum + Number(char) * weights[index], 0)
    const remainder = total % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  const first = checkDigit(digits.slice(0, 12))
  const second = checkDigit(digits.slice(0, 12) + first)
  return digits.endsWith(`${first}${second}`)
}

export function createCnpjSchema(t: SchemaMessageTranslator<'cnpjInvalid' | 'cnpjRequired'>) {
  return z.string().trim().min(1, t('cnpjRequired')).refine(isValidCnpj, t('cnpjInvalid'))
}
