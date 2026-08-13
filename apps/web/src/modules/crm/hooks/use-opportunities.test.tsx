import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { crmService } from '../services/crm-service'
import type { Opportunity } from '../types/opportunity'
import {
  crmQueryKeys,
  useCrmProperties,
  useOpportunities,
  useUpdateOpportunity,
} from './use-opportunities'

vi.mock('../services/crm-service', () => ({
  crmService: {
    list: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    listProperties: vi.fn(),
    getProperty: vi.fn(),
  },
}))

const opportunity: Opportunity = {
  id: 'opportunity-1',
  tenantId: 'tenant-1',
  imovelId: 'property-1',
  interessadoNome: 'Maria Silva',
  interessadoEmail: 'maria@example.com',
  interessadoTelefone: null,
  valorProposto: 4800,
  prazoContratoMeses: null,
  inicioPretendido: null,
  garantiaContratual: 'NENHUMA',
  condicoesEspeciais: [],
  observacoes: null,
  status: 'ENVIADA',
  arquivadaEm: null,
  createdAt: '2026-08-12T10:00:00.000Z',
  updatedAt: '2026-08-12T10:00:00.000Z',
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('CRM query keys and hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('scopes list keys by tenant and normalized filters', () => {
    expect(crmQueryKeys.list('tenant-1', { status: 'ENVIADA' })).toEqual([
      'crm',
      'opportunities',
      'tenant-1',
      'list',
      { status: 'ENVIADA', includeArchived: false },
    ])
    expect(crmQueryKeys.list('tenant-2', { includeArchived: true })).not.toEqual(
      crmQueryKeys.list('tenant-1', { includeArchived: true }),
    )
  })

  it('loads a filtered tenant opportunity list', async () => {
    vi.mocked(crmService.list).mockResolvedValueOnce([opportunity])
    const queryClient = createQueryClient()
    const filters = { status: 'ENVIADA' as const }
    const { result } = renderHook(() => useOpportunities('tenant-1', filters), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(crmService.list).toHaveBeenCalledWith(filters)
    expect(queryClient.getQueryData(crmQueryKeys.list('tenant-1', filters))).toEqual([opportunity])
  })

  it('scopes public property queries by the active CRM tenant', async () => {
    vi.mocked(crmService.listProperties).mockResolvedValueOnce([])
    const queryClient = createQueryClient()
    const filters = { finalidade: 'ALUGUEL' as const, q: 'Jardins' }
    const { result } = renderHook(() => useCrmProperties('tenant-1', filters), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(crmService.listProperties).toHaveBeenCalledWith(filters)
    expect(crmQueryKeys.propertyList('tenant-1', filters)).not.toEqual(
      crmQueryKeys.propertyList('tenant-2', filters),
    )
  })

  it('does not request opportunities without a tenant', () => {
    const queryClient = createQueryClient()
    const { result } = renderHook(() => useOpportunities(null), {
      wrapper: createWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(crmService.list).not.toHaveBeenCalled()
  })

  it('updates the detail cache and invalidates tenant lists after an update', async () => {
    const updated = { ...opportunity, status: 'EM_NEGOCIACAO' as const }
    vi.mocked(crmService.update).mockResolvedValueOnce(updated)
    const queryClient = createQueryClient()
    const listKey = crmQueryKeys.list('tenant-1')
    queryClient.setQueryData(listKey, [opportunity])
    const { result } = renderHook(() => useUpdateOpportunity('tenant-1'), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({
        id: opportunity.id,
        changes: { status: 'EM_NEGOCIACAO' },
      })
    })

    expect(queryClient.getQueryData(crmQueryKeys.detail('tenant-1', opportunity.id))).toEqual(
      updated,
    )
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true)
  })
})
