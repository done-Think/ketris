import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadEnv() {
  vi.resetModules()
  const { env } = await import('./env')
  return env
}

describe('env.apiUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('resolve para "/api" (relativo, mesma origem) quando NEXT_PUBLIC_API_URL está vazio', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '')
    const env = await loadEnv()

    expect(env.apiUrl).toBe('/api')
  })

  it('resolve para "/api" quando NEXT_PUBLIC_API_URL não está definido', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', undefined)
    const env = await loadEnv()

    expect(env.apiUrl).toBe('/api')
  })

  it('acrescenta /api a uma URL absoluta configurada (BFF extraído para outro serviço)', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.ketris.dev')
    const env = await loadEnv()

    expect(env.apiUrl).toBe('https://api.ketris.dev/api')
  })
})
