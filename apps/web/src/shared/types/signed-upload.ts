import type { AppRequestConfig } from './http-client'

export type SignedUploadTarget = {
  url: string
  headers: Record<string, string>
}

export type SignedUploadOptions = Pick<AppRequestConfig, 'onUploadProgress'>
