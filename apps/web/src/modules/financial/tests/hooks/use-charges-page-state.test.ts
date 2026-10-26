import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useChargesPageState } from '../../hooks/use-charges-page-state'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useChargesPageState', () => {
  it('starts on receivables, all statuses, first page', () => {
    const { result } = renderHook(() => useChargesPageState(false))
    expect(result.current.query).toEqual({
      type: 'A_RECEBER',
      status: undefined,
      search: undefined,
      page: 1,
      pageSize: 6,
    })
  })

  it('maps filters to the API and goes back to the first page when they change', () => {
    const { result } = renderHook(() => useChargesPageState(false))
    act(() => result.current.setPage(3))
    act(() => result.current.setStatus('overdue'))
    expect(result.current.query).toMatchObject({ status: 'ATRASADA', page: 1 })

    act(() => result.current.setPage(2))
    act(() => result.current.setDirection('payable'))
    expect(result.current.query).toMatchObject({ type: 'A_PAGAR', status: undefined, page: 1 })

    act(() => result.current.setRowsPerPage(25))
    expect(result.current.query).toMatchObject({ pageSize: 25, page: 1 })
  })

  it('debounces and trims the search', () => {
    const { result } = renderHook(() => useChargesPageState(false))
    act(() => result.current.setSearch('  Mariana '))
    expect(result.current.filters.search).toBe('  Mariana ')
    expect(result.current.query.search).toBeUndefined()
    act(() => vi.advanceTimersByTime(300))
    expect(result.current.query.search).toBe('Mariana')
  })

  it('always asks for receivables when only those are visible', () => {
    const { result } = renderHook(() => useChargesPageState(true))
    act(() => result.current.setDirection('payable'))
    expect(result.current.query.type).toBe('A_RECEBER')
  })

  it('opens and closes dialogs', () => {
    const { result } = renderHook(() => useChargesPageState(false))
    act(() => result.current.openDialog({ kind: 'create' }))
    expect(result.current.dialog).toEqual({ kind: 'create' })
    act(() => result.current.closeDialog())
    expect(result.current.dialog).toBeNull()
  })
})
