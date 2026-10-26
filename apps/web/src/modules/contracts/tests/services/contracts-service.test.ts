import { describe, expect, it, vi } from 'vitest'
import type { HttpClient } from '@shared/lib/api/http-client'
import { ContractsService } from '../../services/contracts-service'

describe('ContractsService', () => {
  it('encaminha os filtros e a página sem enviar valores ausentes', async () => {
    const result = { items: [], totalCount: 31 }
    const get = vi.fn().mockResolvedValue(result)
    const service = new ContractsService({ get } as unknown as HttpClient)
    expect(
      await service.list({
        search: 'Apartamento',
        status: 'ATIVO',
        type: 'RESIDENCIAL',
        page: 2,
        pageSize: 10,
      }),
    ).toBe(result)
    expect(get).toHaveBeenCalledWith('/contracts', {
      params: {
        search: 'Apartamento',
        status: 'ATIVO',
        type: 'RESIDENCIAL',
        page: '2',
        pageSize: '10',
      },
    })
  })

  it('preserva falhas de rede para que a tela decida como apresentar o erro', async () => {
    const error = new Error('Rede indisponível')
    const get = vi.fn().mockRejectedValue(error)
    const service = new ContractsService({ get } as unknown as HttpClient)
    await expect(service.get('contract-1')).rejects.toBe(error)
    expect(get).toHaveBeenCalledWith('/contracts/contract-1')
  })
})
