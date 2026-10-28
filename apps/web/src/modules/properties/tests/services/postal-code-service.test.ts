// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let lookupPostalCode: (typeof import('../../services/postal-code-service'))['lookupPostalCode']
const signal = new AbortController().signal
const address = {
  logradouro: 'Rua Padre Júlio Chevalier',
  bairro: 'Anhumas',
  localidade: 'Itajubá',
  uf: 'MG',
}
beforeEach(async () => {
  vi.resetModules()
  ;({ lookupPostalCode } = await import('../../services/postal-code-service'))
})
afterEach(() => vi.unstubAllGlobals())

describe('ViaCEP service', () => {
  it('maps the external address and caches a normalized CEP', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(address)))
    vi.stubGlobal('fetch', fetch)
    const result = await lookupPostalCode('37502-330', signal)
    expect(result).toEqual({
      street: address.logradouro,
      neighborhood: 'Anhumas',
      city: 'Itajubá',
      state: 'MG',
    })
    expect(fetch).toHaveBeenCalledWith('https://viacep.com.br/ws/37502330/json/', { signal })
    expect(await lookupPostalCode('37502330', signal)).toEqual(result)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it.each(['', '123', '37502A330', '375023300', '../37502330'])(
    'rejects invalid CEP %s before a request',
    async (value) => {
      const fetch = vi.fn()
      vi.stubGlobal('fetch', fetch)
      expect(await lookupPostalCode(value, signal)).toBeNull()
      expect(fetch).not.toHaveBeenCalled()
    },
  )

  it.each([true, 'true'])('handles the provider not-found marker %s', async (erro) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ erro }))))
    expect(await lookupPostalCode('99999999', signal)).toBeNull()
  })

  it('reports upstream failure for the form to handle without changing existing data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })))
    await expect(lookupPostalCode('37502330', signal)).rejects.toThrow(
      'Postal code service unavailable.',
    )
  })
})
