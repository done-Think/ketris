import { describe, expect, it } from 'vitest'

import { listInquiriesQuerySchema } from './list-inquiries.schema'

describe('listInquiriesQuerySchema', () => {
  it('aceita um objeto vazio (sem filtros)', () => {
    const result = listInquiriesQuerySchema.safeParse({})

    expect(result.success).toBe(true)
  })

  it('converte includeArchived de string para boolean', () => {
    const result = listInquiriesQuerySchema.parse({ includeArchived: 'true' })

    expect(result.includeArchived).toBe(true)
  })

  it('rejeita status fora do enum', () => {
    const result = listInquiriesQuerySchema.safeParse({ status: 'FECHADA' })

    expect(result.success).toBe(false)
  })
})
