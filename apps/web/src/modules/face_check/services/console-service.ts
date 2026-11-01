import { isCancel } from 'axios'

import { httpClient } from '@shared/lib/api/http-client'

import type {
  CreateSessionInput,
  DecisionInput,
  OverviewMetrics,
  OverviewScope,
  SessionListQuery,
  SessionListResult,
  VerificationSession,
  VerificationSettings,
  FaceCheckProperty,
} from '../types'
import type { CreatedSession } from '../types/api.types'
import { normalizeApiError } from './api-error'

const base = '/face_check'
async function privateRequest<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (isCancel(error)) throw error
    const response = (error as { response?: { status?: number; data?: unknown } })?.response
    if (response?.data instanceof Blob) {
      const body = await response.data
        .text()
        .then((text) => JSON.parse(text))
        .catch(() => undefined)
      throw normalizeApiError(body, response.status)
    }
    throw normalizeApiError(error)
  }
}
async function sessionRequest(operation: () => Promise<{ session: VerificationSession }>) {
  return (await privateRequest(operation)).session
}

export const consoleService = {
  listProperties: (signal?: AbortSignal) =>
    privateRequest(() => httpClient.get<FaceCheckProperty[]>(`${base}/properties`, { signal })),
  listSessions: (query: SessionListQuery, signal?: AbortSignal) =>
    privateRequest(() =>
      httpClient.get<SessionListResult>(`${base}/sessions`, {
        signal,
        params: {
          filter: query.filter,
          q: query.search,
          page: query.page,
          pageSize: query.pageSize,
        },
      }),
    ),
  getSession: (id: string, signal?: AbortSignal) =>
    sessionRequest(() =>
      httpClient.get(`${base}/sessions/${encodeURIComponent(id)}`, { signal, timeout: 110000 }),
    ),
  createSession: (input: CreateSessionInput) =>
    privateRequest(() => httpClient.post<CreatedSession>(`${base}/sessions`, input)),
  recordEvidenceView: (id: string) =>
    sessionRequest(() =>
      httpClient.post(`${base}/sessions/${encodeURIComponent(id)}/evidence-view`),
    ),
  getEvidence: (id: string, reference: string, signal?: AbortSignal) =>
    privateRequest(() =>
      httpClient.get<Blob>(
        `${base}/sessions/${encodeURIComponent(id)}/evidence/${encodeURIComponent(reference)}`,
        { responseType: 'blob', signal },
      ),
    ),
  decide: (id: string, input: DecisionInput) =>
    sessionRequest(() =>
      httpClient.post(`${base}/sessions/${encodeURIComponent(id)}/decision`, input, {
        timeout: 110000,
      }),
    ),
  reopen: (id: string) =>
    sessionRequest(() => httpClient.post(`${base}/sessions/${encodeURIComponent(id)}/reopen`)),
  getOverview: (_scope: OverviewScope, signal?: AbortSignal) =>
    privateRequest(() => httpClient.get<OverviewMetrics>(`${base}/metrics/overview`, { signal })),
  getSettings: (signal?: AbortSignal) =>
    privateRequest(() => httpClient.get<VerificationSettings>(`${base}/settings`, { signal })),
  updateSettings: (settings: VerificationSettings) =>
    privateRequest(() => httpClient.put<VerificationSettings>(`${base}/settings`, settings)),
}
