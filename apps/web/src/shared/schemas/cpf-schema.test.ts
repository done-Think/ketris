import { describe, expect, it } from 'vitest'

import { cpfSchema, isValidCpf } from './cpf-schema'

describe('isValidCpf', () => {
  it('accepts a valid CPF, formatted or not', () => {
    expect(isValidCpf('111.444.777-35')).toBe(true)
    expect(isValidCpf('11144477735')).toBe(true)
  })

  it('rejects a CPF with an invalid check digit', () => {
    expect(isValidCpf('111.444.777-36')).toBe(false)
  })

  it('rejects the well-known all-same-digit pattern', () => {
    expect(isValidCpf('111.111.111-11')).toBe(false)
  })

  it('rejects a value with the wrong number of digits', () => {
    expect(isValidCpf('123')).toBe(false)
  })
})

describe('cpfSchema', () => {
  it('accepts a valid CPF', () => {
    expect(cpfSchema.safeParse('111.444.777-35').success).toBe(true)
  })

  it('rejects an empty value', () => {
    expect(cpfSchema.safeParse('').success).toBe(false)
  })

  it('rejects an invalid CPF', () => {
    expect(cpfSchema.safeParse('123.456.789-00').success).toBe(false)
  })
})
