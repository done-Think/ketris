import { describe, expect, it } from 'vitest'

import { firstStepWithErrors } from '../../utils/contract-wizard-errors'

describe('firstStepWithErrors', () => {
  it('aponta a etapa Partes quando o erro está no CPF do locatário ou do fiador', () => {
    expect(firstStepWithErrors({ tenantCpf: { type: 'custom', message: 'x' } })).toBe(1)
    expect(firstStepWithErrors({ guarantorCpf: { type: 'custom', message: 'x' } })).toBe(1)
  })

  it('aponta a primeira etapa com erro quando há erros em várias', () => {
    expect(
      firstStepWithErrors({
        endDate: { type: 'custom', message: 'x' },
        tenantCpf: { type: 'custom', message: 'x' },
      }),
    ).toBe(1)
    expect(firstStepWithErrors({ endDate: { type: 'custom', message: 'x' } })).toBe(2)
  })

  it('não aponta etapa nenhuma sem erros', () => {
    expect(firstStepWithErrors({})).toBe(null)
  })
})
