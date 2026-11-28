import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HttpClient } from '../../../lib/api/http-client'

vi.mock('axios', async () => {
  const { AxiosError } = await vi.importActual<typeof import('axios')>('axios')
  const interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  }
  const instance = Object.assign(vi.fn(), {
    defaults: { headers: { common: {} as Record<string, string> } },
    interceptors,
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  })

  return {
    AxiosError,
    default: {
      create: vi.fn(() => instance),
    },
  }
})

function getResponseErrorHandler() {
  const instance = vi.mocked(axios.create).mock.results.at(-1)?.value
  const call = instance.interceptors.response.use.mock.calls.at(-1)
  return { instance, onRejected: call[1] as (error: unknown) => Promise<unknown> }
}

function fakeUnauthorizedError(config: Record<string, unknown> = {}) {
  return {
    config: { url: '/crm/opportunities', headers: {}, ...config },
    response: { status: 401 },
  }
}

describe('HttpClient — refresh de token em respostas 401', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(axios.create).mock.results.at(-1)?.value?.mockReset()
  })

  it('does not refresh or replay a request from a previous account', async () => {
    const client = new HttpClient()
    const { instance, onRejected } = getResponseErrorHandler()
    const handler = vi.fn().mockResolvedValue('new-token')
    client.setAuthToken('current-account-token')
    client.setUnauthorizedHandler(handler)
    const error = fakeUnauthorizedError({ sessionAccessToken: 'previous-account-token' })
    await expect(onRejected(error)).rejects.toBe(error)
    expect(handler).not.toHaveBeenCalled()
    expect(instance).not.toHaveBeenCalled()
  })

  it('recovers a scoped request with its renewed session token', async () => {
    const client = new HttpClient()
    const { instance, onRejected } = getResponseErrorHandler()
    client.setAuthToken('current-token')
    client.setTenant('tenant-a')
    client.setUnauthorizedHandler(async () => {
      client.setAuthToken('renewed-token')
      return 'renewed-token'
    })
    instance.mockResolvedValue({ data: 'recovered' })
    await expect(
      onRejected(fakeUnauthorizedError({ sessionAccessToken: 'current-token' })),
    ).resolves.toEqual({ data: 'recovered' })
    expect(instance).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer renewed-token' }),
      }),
    )
  })

  it('does not replay an aborted scoped request after refresh', async () => {
    const client = new HttpClient()
    const { instance, onRejected } = getResponseErrorHandler()
    const controller = new AbortController()
    client.setAuthToken('current-token')
    client.setUnauthorizedHandler(async () => {
      controller.abort()
      client.setAuthToken('renewed-token')
      return 'renewed-token'
    })
    const error = fakeUnauthorizedError({
      sessionAccessToken: 'current-token',
      signal: controller.signal,
    })
    await expect(onRejected(error)).rejects.toBe(error)
    expect(instance).not.toHaveBeenCalled()
  })

  it('declares the English contract and never retries a mutation rejected for an old contract', async () => {
    const client = new HttpClient()
    expect(axios.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Ketris-Api-Version': '3' }),
      }),
    )
    const { instance, onRejected } = getResponseErrorHandler()
    const handler = vi.fn()
    client.setUnauthorizedHandler(handler)
    const error = {
      config: { method: 'POST', url: '/properties' },
      response: { status: 409, data: { error: { code: 'CLIENT_UPDATE_REQUIRED' } } },
    }
    await expect(onRejected(error)).rejects.toBe(error)
    expect(instance).not.toHaveBeenCalled()
    expect(handler).not.toHaveBeenCalled()
  })

  it('keeps the application contract header out of direct storage uploads', () => {
    new HttpClient('')
    expect(axios.create).toHaveBeenLastCalledWith(
      expect.objectContaining({ baseURL: '', headers: { 'Content-Type': 'application/json' } }),
    )
  })

  it('rejeita a resposta original quando não há handler de 401 configurado', async () => {
    new HttpClient()
    const { onRejected } = getResponseErrorHandler()
    const error = fakeUnauthorizedError()

    await expect(onRejected(error)).rejects.toBe(error)
  })

  it('rejeita erros que não são 401 sem chamar o handler', async () => {
    const httpClient = new HttpClient()
    const { onRejected } = getResponseErrorHandler()
    const handler = vi.fn()

    httpClient.setUnauthorizedHandler(handler)

    const error = { config: { url: '/crm/opportunities' }, response: { status: 500 } }

    await expect(onRejected(error)).rejects.toBe(error)
    expect(handler).not.toHaveBeenCalled()
  })

  it('renova o token e refaz a requisição original quando o handler retorna um novo access token', async () => {
    const httpClient = new HttpClient()
    const { instance, onRejected } = getResponseErrorHandler()

    const handler = vi.fn().mockResolvedValue('novo-access-token')
    httpClient.setUnauthorizedHandler(handler)
    instance.mockResolvedValueOnce({ data: 'ok-na-segunda-tentativa' })

    const error = fakeUnauthorizedError()
    const result = await onRejected(error)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(instance).toHaveBeenCalledWith(
      expect.objectContaining({
        _retriedAfterRefresh: true,
        headers: expect.objectContaining({ Authorization: 'Bearer novo-access-token' }),
      }),
    )
    expect(result).toEqual({ data: 'ok-na-segunda-tentativa' })
  })

  it('rejeita a resposta original quando o handler não consegue renovar o token', async () => {
    const httpClient = new HttpClient()
    const { instance, onRejected } = getResponseErrorHandler()

    httpClient.setUnauthorizedHandler(vi.fn().mockResolvedValue(null))

    const error = fakeUnauthorizedError()

    await expect(onRejected(error)).rejects.toBe(error)
    expect(instance).not.toHaveBeenCalled()
  })

  it('rejeita sem chamar o handler quando a requisição marca skipUnauthorizedHandling', async () => {
    const httpClient = new HttpClient()
    const { instance, onRejected } = getResponseErrorHandler()
    const handler = vi.fn().mockResolvedValue('token')

    httpClient.setUnauthorizedHandler(handler)

    const error = fakeUnauthorizedError({ skipUnauthorizedHandling: true })

    await expect(onRejected(error)).rejects.toBe(error)
    expect(handler).not.toHaveBeenCalled()
    expect(instance).not.toHaveBeenCalled()
  })

  it('não tenta renovar de novo uma requisição que já foi reenviada após refresh', async () => {
    const httpClient = new HttpClient()
    const { instance, onRejected } = getResponseErrorHandler()
    const handler = vi.fn().mockResolvedValue('token')

    httpClient.setUnauthorizedHandler(handler)

    const error = fakeUnauthorizedError({ _retriedAfterRefresh: true })

    await expect(onRejected(error)).rejects.toBe(error)
    expect(handler).not.toHaveBeenCalled()
    expect(instance).not.toHaveBeenCalled()
  })

  it('deduplica chamadas concorrentes de refresh em uma única execução do handler', async () => {
    const httpClient = new HttpClient()
    const { instance, onRejected } = getResponseErrorHandler()
    let resolveHandler: (token: string) => void = () => {}
    const handler = vi.fn(
      () =>
        new Promise<string | null>((resolve) => {
          resolveHandler = resolve
        }),
    )

    httpClient.setUnauthorizedHandler(handler)
    instance.mockResolvedValue({ data: 'ok' })

    const firstCall = onRejected(fakeUnauthorizedError({ url: '/a' }))
    const secondCall = onRejected(fakeUnauthorizedError({ url: '/b' }))

    resolveHandler('token-unico')

    await Promise.all([firstCall, secondCall])

    expect(handler).toHaveBeenCalledTimes(1)
  })
  it('blocks new requests until authentication can be revalidated', () => {
    const client = new HttpClient()
    const instance = vi.mocked(axios.create).mock.results.at(-1)?.value
    const onRequest = instance.interceptors.request.use.mock.calls.at(-1)[0]
    const config = { url: '/private-data', headers: {} }
    client.setAuthUnavailable(true)
    expect(() => onRequest(config)).toThrow('AUTH_UNAVAILABLE')
    client.setAuthUnavailable(false)
    expect(onRequest(config)).toBe(config)
  })
})
