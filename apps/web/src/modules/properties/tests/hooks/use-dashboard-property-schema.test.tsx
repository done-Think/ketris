import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDashboardPropertySchema } from '../../hooks/use-dashboard-property-schema'
import { isPostalCodeNotFound } from '../../services/postal-code-service'
import { buildEditPropertyFormValues } from '../../utils/build-edit-property-form-values'
import { editableProperty } from '../fixtures/editable-property'

vi.mock('../../services/postal-code-service', () => ({ isPostalCodeNotFound: vi.fn() }))

const values = buildEditPropertyFormValues(editableProperty)

function zipCodeMessages(zipCode: string) {
  const { result } = renderHook(() => useDashboardPropertySchema())
  const parsed = result.current.safeParse({ ...values, zipCode })
  return parsed.success
    ? []
    : parsed.error.issues.filter((issue) => issue.path[0] === 'zipCode').map((i) => i.message)
}

describe('useDashboardPropertySchema', () => {
  beforeEach(() => vi.mocked(isPostalCodeNotFound).mockReturnValue(false))

  it('translates the message for a CEP that cannot exist', () => {
    expect(zipCodeMessages('00000-000')).toContain('Informe um CEP válido')
  })

  it('blocks a CEP the lookup reported as not found', () => {
    vi.mocked(isPostalCodeNotFound).mockImplementation((zipCode) => zipCode === '37502-330')
    expect(zipCodeMessages('37502-330')).toEqual(['CEP não encontrado. Confira o CEP informado.'])
    expect(isPostalCodeNotFound).toHaveBeenCalledWith('37502-330')
  })

  it('accepts a CEP the lookup found', () => {
    expect(zipCodeMessages('37502-330')).toEqual([])
  })
})
