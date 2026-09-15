import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

import { env } from '@config/env'

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retriedAfterRefresh?: boolean }

export type UnauthorizedHandler = () => Promise<string | null>

export class HttpClient {
  protected instance: AxiosInstance
  private unauthorizedHandler: UnauthorizedHandler | null = null
  private refreshPromise: Promise<string | null> | null = null

  constructor(baseURL: string = env.apiUrl) {
    this.instance = axios.create({
      baseURL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        return config
      },
      (error) => Promise.reject(error),
    )

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config as RetryableRequestConfig | undefined
        const isUnauthorized = error.response?.status === 401

        if (!isUnauthorized || !originalRequest || originalRequest._retriedAfterRefresh) {
          return Promise.reject(error)
        }

        const newAccessToken = await this.refreshAccessToken()

        if (!newAccessToken) {
          return Promise.reject(error)
        }

        originalRequest._retriedAfterRefresh = true
        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

        return this.instance(originalRequest)
      },
    )
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.unauthorizedHandler) return null

    this.refreshPromise ??= this.unauthorizedHandler().finally(() => {
      this.refreshPromise = null
    })

    return this.refreshPromise
  }

  setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
    this.unauthorizedHandler = handler
  }

  setAuthToken(token: string | null): void {
    if (token) {
      this.instance.defaults.headers.common.Authorization = `Bearer ${token}`
    } else {
      delete this.instance.defaults.headers.common.Authorization
    }
  }

  setTenant(tenantId: string | null): void {
    if (tenantId) {
      this.instance.defaults.headers.common['X-Tenant-Id'] = tenantId
    } else {
      delete this.instance.defaults.headers.common['X-Tenant-Id']
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.instance.get<T>(url, config)
    return data
  }

  async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.instance.post<T>(url, body, config)
    return data
  }

  async put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.instance.put<T>(url, body, config)
    return data
  }

  async patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.instance.patch<T>(url, body, config)
    return data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.instance.delete<T>(url, config)
    return data
  }
}

export const httpClient = new HttpClient()
