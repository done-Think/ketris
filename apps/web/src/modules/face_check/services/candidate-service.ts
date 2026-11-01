import { isCancel } from 'axios'
import { httpClient } from '@shared/lib/api/http-client'
import type { CandidateVerificationsResponse } from '../types/candidate.types'
import { normalizeApiError } from './api-error'

export const candidateService = {
  async list(signal?: AbortSignal, accessToken?: string) {
    try {
      return await httpClient.get<CandidateVerificationsResponse>('/face_check/my-verifications', {
        signal,
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          'Accept-Language':
            typeof document === 'undefined' ? 'pt-BR' : document.documentElement.lang,
        },
      })
    } catch (error) {
      if (isCancel(error)) throw error
      throw normalizeApiError(error)
    }
  },
}
