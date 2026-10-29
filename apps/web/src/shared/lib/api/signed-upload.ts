import type { HttpClient } from './http-client'
import type { SignedUploadOptions, SignedUploadTarget } from '@shared/types/signed-upload'

export async function uploadToSignedUrl(
  storage: HttpClient,
  target: SignedUploadTarget,
  file: Blob,
  options: SignedUploadOptions = {},
): Promise<void> {
  await storage.put<void>(target.url, file, {
    headers: target.headers,
    timeout: 120000,
    withCredentials: false,
    skipUnauthorizedHandling: true,
    ...options,
  })
}
