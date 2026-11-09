import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

import { isValidCnpj } from './cnpj-schema'
import { isValidCpf } from './cpf-schema'

export type DocumentKind = 'cpf' | 'cnpj'

/** A person is identified by a CPF (11 digits) or by the CNPJ (14 digits) of their own company. */
export function documentKindOf(value: string): DocumentKind | null {
  const length = value.replace(/\D/g, '').length
  if (length === 11) return 'cpf'
  if (length === 14) return 'cnpj'
  return null
}

export function isValidDocument(value: string): boolean {
  const kind = documentKindOf(value)
  return kind === 'cpf' ? isValidCpf(value) : kind === 'cnpj' ? isValidCnpj(value) : false
}

/** Splits a typed document into the column it belongs to. */
export function splitDocument(value: string): { cpf: string | null; cnpj: string | null } {
  const digits = value.replace(/\D/g, '')
  const kind = documentKindOf(digits)
  return { cpf: kind === 'cpf' ? digits : null, cnpj: kind === 'cnpj' ? digits : null }
}

export function createDocumentSchema(
  t: SchemaMessageTranslator<'documentInvalid' | 'documentRequired'>,
) {
  return z
    .string()
    .trim()
    .min(1, t('documentRequired'))
    .refine(isValidDocument, t('documentInvalid'))
}
