import type { AxiosRequestConfig } from 'axios'

export type AppRequestConfig = AxiosRequestConfig & { skipUnauthorizedHandling?: boolean }

export type UnauthorizedHandler = () => Promise<string | null>

export type RefreshTokenResponse = {
  accessToken: string
  refreshToken: string
}
