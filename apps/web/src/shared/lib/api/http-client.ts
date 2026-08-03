import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

import { env } from '@config/env'

// Cliente HTTP base, instanciado como classe para ser estendido e reutilizado.
// Ex.: cada módulo cria um service que recebe esta instância.
export class HttpClient {
  protected instance: AxiosInstance

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
        // Token e tenant são injetados aqui (integra com NextAuth no client).
        return config
      },
      (error) => Promise.reject(error),
    )

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        // Ponto central para tratar 401 (refresh), 403, 5xx etc.
        return Promise.reject(error)
      },
    )
  }

  // Permite setar o token de autenticação em runtime.
  setAuthToken(token: string | null): void {
    if (token) {
      this.instance.defaults.headers.common.Authorization = `Bearer ${token}`
    } else {
      delete this.instance.defaults.headers.common.Authorization
    }
  }

  // Permite setar o tenant ativo (multi-tenant).
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

// Instância única compartilhada.
export const httpClient = new HttpClient()
