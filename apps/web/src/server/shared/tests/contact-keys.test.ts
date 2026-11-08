import { describe, expect, it } from 'vitest'

import { isValidCnpj } from '@shared/schemas/cnpj-schema'

import { creciKey, documentKey, phoneKey } from '../contact-keys'

describe('contact keys', () => {
  it('treats formatted and plain phone numbers as the same value', () => {
    expect(phoneKey('(35) 99999-9999')).toBe('35999999999')
    expect(phoneKey('35 99999 9999')).toBe(phoneKey('35999999999'))
    expect(phoneKey('')).toBeNull()
    expect(phoneKey(undefined)).toBeNull()
  })

  it('treats CRECI spelling variants as the same value', () => {
    expect(creciKey('mg-12345-j')).toBe('MG12345J')
    expect(creciKey(' MG 12345 J ')).toBe(creciKey('MG-12345-J'))
    expect(creciKey('')).toBeNull()
  })

  it('keeps only the digits of a CPF or CNPJ', () => {
    expect(documentKey('529.982.247-25')).toBe('52998224725')
    expect(documentKey('11.222.333/0001-81')).toBe('11222333000181')
  })
})

describe('isValidCnpj', () => {
  it('accepts a valid CNPJ with or without punctuation', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true)
    expect(isValidCnpj('11222333000181')).toBe(true)
  })

  it.each(['11.222.333/0001-82', '11111111111111', '123', ''])('rejects %s', (value) => {
    expect(isValidCnpj(value)).toBe(false)
  })
})
