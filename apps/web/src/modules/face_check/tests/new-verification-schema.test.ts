import { describe, expect, it } from 'vitest'

import { newVerificationSchema } from '../schemas/console.schemas'

const input = {
  propertyId: 'property-1',
  purpose: 'RENT',
  personName: 'Person Name',
  cpf: '',
  reference: '',
  contact: '',
  acceptedDocument: 'ANY',
  expiresInHours: 24,
}

describe('face_check session creation', () => {
  it('requires a selected property even when a reference was provided', () => {
    expect(
      newVerificationSchema.safeParse({ ...input, propertyId: '', reference: 'Another property' })
        .success,
    ).toBe(false)
  })
  it('accepts rent and buy with an optional CPF', () => {
    expect(newVerificationSchema.parse(input).purpose).toBe('RENT')
    expect(newVerificationSchema.parse({ ...input, purpose: 'BUY' }).purpose).toBe('BUY')
  })
  it('rejects a purpose outside the supported property workflows', () => {
    expect(newVerificationSchema.safeParse({ ...input, purpose: 'OTHER' }).success).toBe(false)
  })
})
