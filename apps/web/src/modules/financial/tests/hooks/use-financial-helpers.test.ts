import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useFinancialError } from '../../hooks/use-financial-error'
import { useFinancialFormat } from '../../hooks/use-financial-format'
import { apiError } from '../fixtures/render'

describe('useFinancialError', () => {
  it('translates known API codes and falls back for unknown errors', () => {
    const { result } = renderHook(() => useFinancialError())
    expect(result.current(apiError('CHARGE_HAS_MOVEMENT'), 'deleteFailed')).toMatch(
      /Cancelar cobrança/,
    )
    expect(result.current(apiError('CHARGE_CONCURRENT_CHANGE'), 'updateFailed')).toBe(
      'A cobrança foi alterada por outra pessoa. Recarregue e tente de novo.',
    )
    expect(result.current(new Error('boom'), 'deleteFailed')).toBe(
      'Não foi possível excluir a cobrança.',
    )
    expect(result.current(apiError('SOMETHING_ELSE'), 'exportFailed')).toBe(
      'Não foi possível exportar as cobranças.',
    )
  })
})

describe('useFinancialFormat', () => {
  const normalize = (value: string) => value.replace(/\s/g, ' ')

  it('always formats money in BRL', () => {
    const { result } = renderHook(() => useFinancialFormat())
    expect(normalize(result.current.currency(2800.5))).toBe('R$ 2.800,50')
  })

  it('formats calendar dates without shifting the day', () => {
    const { result } = renderHook(() => useFinancialFormat())
    expect(result.current.date('2026-10-31T00:00:00.000Z')).toBe('31/10/2026')
    expect(result.current.month('2026-10')).toBe('outubro de 2026')
    expect(result.current.shortMonth(2026, 9)).toBe('set')
  })

  it('formats percentages and file sizes', () => {
    const { result } = renderHook(() => useFinancialFormat())
    expect(result.current.percent(12.5)).toBe('12,5%')
    expect(result.current.fileSize(2048)).toBe('2 KB')
    expect(result.current.fileSize(300)).toBe('1 KB')
    expect(result.current.fileSize(3.5 * 1024 * 1024)).toBe('3,5 MB')
  })
})
