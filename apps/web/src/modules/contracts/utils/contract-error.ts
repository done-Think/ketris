import axios from 'axios'
import type { SchemaMessageTranslator } from '@shared/types'

const codes = new Set([
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
])

export function contractError(error: unknown, t: SchemaMessageTranslator) {
  const code = axios.isAxiosError(error) ? error.response?.data?.error?.code : null
  return t(typeof code === 'string' && codes.has(code) ? code : 'generic')
}

export function isContractNotFound(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404
}
