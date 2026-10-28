import axios from 'axios'
import type { SchemaMessageTranslator } from '@shared/types'
import type { TranslationKey } from '@/i18n/types/messages.types'

const codes = [
  'CONFLICT',
  'CONTRACT_EDITING_LOCKED',
  'CONTRACT_TRANSITION_NOT_ALLOWED',
  'CONTRACT_DOCUMENT_NOT_FOUND',
  'CONTRACT_DOCUMENT_OUTDATED',
  'CONTRACT_EVIDENCE_REQUIRED',
  'CONTRACT_DOCUMENT_INVALID',
  'CONTRACT_DOCUMENT_STORAGE_UNAVAILABLE',
  'CONTRACT_UPLOAD_EXPIRED',
  'CONTRACT_UPLOAD_INVALID',
  'CONTRACT_PARTY_ALREADY_SIGNED',
  'CONTRACT_RENTER_USER_NOT_FOUND',
  'CONTRACT_PARTY_EMAIL_MISMATCH',
  'CONTRACT_RENTER_USER_AMBIGUOUS',
  'CONTRACT_PARTY_ALREADY_LINKED',
  'CONTRACT_OPPORTUNITY_ALREADY_HAS_CONTRACT',
  'CONTRACT_OPPORTUNITY_NOT_ACCEPTED',
  'FORBIDDEN',
  'UNAUTHORIZED',
] as const satisfies readonly TranslationKey<'contracts.errors'>[]

const translationKeys = new Map<string, (typeof codes)[number]>(codes.map((code) => [code, code]))

export function contractError(
  error: unknown,
  t: SchemaMessageTranslator<TranslationKey<'contracts.errors'>>,
) {
  const code = axios.isAxiosError(error) ? error.response?.data?.error?.code : null
  const key = typeof code === 'string' ? translationKeys.get(code) : undefined
  return t(key ?? 'generic')
}

export function isContractNotFound(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404
}
