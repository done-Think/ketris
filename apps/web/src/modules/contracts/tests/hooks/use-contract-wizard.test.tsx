import { act, renderHook } from '@testing-library/react'
import { expect, it } from 'vitest'
import { useContractWizard } from '../../hooks/use-contract-wizard'
import { createContractDefaultValues } from '../../schemas/create-contract-schema'

it('mantém navegação fora dos dados do contrato e impede pular etapas ainda não liberadas', () => {
  const { result } = renderHook(() => useContractWizard())
  expect(createContractDefaultValues).not.toHaveProperty('activeStepIndex')
  expect(createContractDefaultValues).not.toHaveProperty('maxStepIndex')
  act(() => result.current.select(3))
  expect(result.current.activeStepIndex).toBe(0)
  act(() => result.current.next())
  expect(result.current.activeStepIndex).toBe(1)
  expect(result.current.maxStepIndex).toBe(1)
  act(() => result.current.previous())
  expect(result.current.activeStepIndex).toBe(0)
  act(() => result.current.select(1))
  expect(result.current.activeStepIndex).toBe(1)
  act(() => result.current.select(-1))
  expect(result.current.activeStepIndex).toBe(1)
})

it('limita o avanço e a volta aos índices válidos do assistente', () => {
  const { result } = renderHook(() => useContractWizard())
  act(() => result.current.previous())
  expect(result.current.activeStepIndex).toBe(0)
  for (let index = 0; index < 5; index++) act(() => result.current.next())
  expect(result.current.activeStepIndex).toBe(3)
  expect(result.current.maxStepIndex).toBe(3)
})
