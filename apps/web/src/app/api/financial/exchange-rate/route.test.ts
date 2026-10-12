import { afterEach, describe, expect, it, vi } from 'vitest'

import { GET } from './route'

afterEach(() => vi.unstubAllGlobals())

describe('GET /api/financial/exchange-rate', () => {
  it('rejects currencies outside the supported display set', async () => {
    const response = await GET(
      new Request('http://localhost/api/financial/exchange-rate?currency=GBP'),
    )
    expect(response.status).toBe(400)
  })

  it('uses the latest official closing quote, not an intraday quote', async () => {
    const upstream = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        value: [
          {
            cotacaoVenda: 6.5,
            dataHoraCotacao: '2026-10-06 13:00:00.000',
            tipoBoletim: 'Fechamento',
          },
          {
            cotacaoVenda: 6.7,
            dataHoraCotacao: '2026-10-07 10:00:00.000',
            tipoBoletim: 'Abertura',
          },
          {
            cotacaoVenda: 6.4,
            dataHoraCotacao: '2026-10-05 13:00:00.000',
            tipoBoletim: 'Fechamento',
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', upstream)

    const response = await GET(
      new Request('http://localhost/api/financial/exchange-rate?currency=EUR'),
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      currency: 'EUR',
      brlPerUnit: 6.5,
      date: '2026-10-06',
    })
    expect(upstream).toHaveBeenCalledOnce()
    expect(String(upstream.mock.calls[0][0])).toContain('%40moeda=%27EUR%27')
  })

  it('does not fabricate an exchange rate when the source fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const response = await GET(
      new Request('http://localhost/api/financial/exchange-rate?currency=USD'),
    )
    expect(response.status).toBe(503)
  })
})
