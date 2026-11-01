import { API_CONTRACT_HEADER, API_CONTRACT_VERSION } from '@shared/config/api-contract'

import type {
  AlternativeRequestInput,
  CaptureSessionView,
  CaptureStatusView,
  ConsentInput,
} from '../types'
import type { ChallengesResponse } from '../types/api.types'
import type { DocumentRegionsResult } from '../types/document-import.types'
import type { LivenessProximityResult } from '../types/liveness-proximity.types'
import type {
  DocumentImageUploadInput,
  LivenessFrameInput,
  LivenessProgressView,
} from '../types/capture.types'
import { maxCapturePhotoBytes } from '../utils/upload-limits'
import { ApiError, normalizeApiError } from './api-error'

const capturePath = (token: string) => `/api/face_check/capture/${encodeURIComponent(token)}`

// Verification tokens must never enter the dashboard refresh/logout interceptors.
async function request<T>(
  path: string,
  body?: unknown,
  options?: { signal?: AbortSignal; timeout?: number },
): Promise<T> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  options?.signal?.addEventListener('abort', abort, { once: true })
  if (options?.signal?.aborted) controller.abort()
  const timeout = setTimeout(abort, options?.timeout ?? 110000)
  try {
    const form = body instanceof FormData
    const response = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'omit',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        [API_CONTRACT_HEADER]: API_CONTRACT_VERSION,
        'Accept-Language':
          typeof document === 'undefined' ? 'pt-BR' : document.documentElement.lang,
        ...(form || body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : form ? body : JSON.stringify(body),
    })
    const data = response.status === 204 ? undefined : await response.json().catch(() => undefined)
    if (!response.ok) throw normalizeApiError(data, response.status)
    return data as T
  } catch (error) {
    if (error instanceof ApiError || options?.signal?.aborted) throw error
    throw new ApiError('NETWORK_ERROR', 0)
  } finally {
    clearTimeout(timeout)
    options?.signal?.removeEventListener('abort', abort)
  }
}

function photoForm(name: string, image: Blob, metadata: Record<string, string> = {}) {
  if (!image.size) throw new ApiError('IMAGE_REQUIRED', 400)
  if (image.size > maxCapturePhotoBytes) throw new ApiError('PAYLOAD_TOO_LARGE', 413)
  const form = new FormData()
  Object.entries(metadata).forEach(([key, value]) => form.set(key, value))
  form.set(name, image, `${name}.jpg`)
  return form
}

export const captureService = {
  proximity: (token: string, image: Blob, signal: AbortSignal) =>
    request<LivenessProximityResult>(`${capturePath(token)}/proximity`, photoForm('image', image), {
      signal,
      timeout: 4000,
    }),
  documentRegions: (token: string, image: Blob, signal?: AbortSignal) =>
    request<DocumentRegionsResult>(
      `${capturePath(token)}/document-regions`,
      photoForm('image', image),
      { signal },
    ),
  getSession: (token: string, signal?: AbortSignal) =>
    request<CaptureSessionView>(capturePath(token), undefined, { signal }),
  consent: (token: string, input: ConsentInput, signal?: AbortSignal) =>
    request<CaptureSessionView>(`${capturePath(token)}/consent`, input, { signal }),
  uploadDocumentImage: (token: string, input: DocumentImageUploadInput, signal?: AbortSignal) =>
    request<void>(
      `${capturePath(token)}/document`,
      photoForm('image', input.image, { side: input.side, documentType: input.documentType }),
      { signal },
    ),
  getChallenges: async (token: string, signal?: AbortSignal) =>
    (await request<ChallengesResponse>(`${capturePath(token)}/challenges`, undefined, { signal }))
      .challenges,
  uploadSelfie: (token: string, image: Blob, signal?: AbortSignal) =>
    request<void>(`${capturePath(token)}/liveness`, photoForm('selfie', image), { signal }),
  uploadLivenessFrame: (token: string, input: LivenessFrameInput, signal?: AbortSignal) =>
    request<LivenessProgressView>(
      `${capturePath(token)}/liveness-frame`,
      photoForm('image', input.image, { challenge: input.challenge }),
      { signal },
    ),
  submit: (token: string, signal?: AbortSignal) =>
    request<CaptureStatusView>(`${capturePath(token)}/submit`, {}, { signal }),
  getStatus: (token: string, signal?: AbortSignal) =>
    request<CaptureStatusView>(`${capturePath(token)}/status`, undefined, { signal }),
  requestAlternative: (token: string, input: AlternativeRequestInput, signal?: AbortSignal) =>
    request<CaptureSessionView>(`${capturePath(token)}/alternative`, input, { signal }),
}
