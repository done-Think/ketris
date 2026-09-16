import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HttpClient } from './http-client'

vi.mock('axios', () => {
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
})
