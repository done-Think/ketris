import { describe, expect, it } from 'vitest'

import { chargeReceiptObjectKey, matchesReceiptSignature } from '../../domain/charge-receipt'

describe('chargeReceiptObjectKey', () => {
  it('monta a chave privada por tenant, cobrança e arquivo', () => {
    expect(
      chargeReceiptObjectKey({
        tenantId: 't',
        chargeId: 'c',
        id: 'r',
        contentType: 'image/png',
      }),
    ).toBe('financial/t/c/r.png')
  })
})

describe('matchesReceiptSignature', () => {
  it('confere os bytes iniciais de PDF, JPG e PNG', () => {
    expect(
      matchesReceiptSignature('application/pdf', new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])),
    ).toBe(true)
    expect(matchesReceiptSignature('image/jpeg', new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(
      true,
    )
    expect(
      matchesReceiptSignature(
        'image/png',
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toBe(true)
  })

  it('recusa arquivo que não bate com o tipo informado', () => {
    expect(
      matchesReceiptSignature('image/png', new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])),
    ).toBe(false)
    expect(matchesReceiptSignature('text/html', new Uint8Array([0x3c]))).toBe(false)
  })
})
