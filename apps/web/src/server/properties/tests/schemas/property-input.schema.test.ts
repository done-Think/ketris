import { describe, expect, it } from 'vitest'

import {
  createPropertyRequestSchema,
  updatePropertyRequestSchema,
} from '../../schemas/property-input.schema'

const listing = {
  comodidades: ['MOBILIADO', 'ACEITA_PETS'],
  condicoesNegociacao: 'Caução de dois aluguéis',
  publicarAposRevisao: true,
  permiteContatoWhatsapp: true,
  destaque: false,
}

describe('property input contract', () => {
  it('accepts typed property and listing fields', () => {
    expect(
      createPropertyRequestSchema.parse({
        titulo: 'Casa',
        tipo: 'CASA',
        finalidade: 'ALUGUEL',
        valor: 2000,
        anuncio: listing,
      }).anuncio,
    ).toEqual(listing)
  })

  it('rejects free-text property types', () => {
    expect(updatePropertyRequestSchema.safeParse({ tipo: 'qualquer coisa' }).success).toBe(false)
  })

  it('rejects unsupported amenities and unrecognized listing flags', () => {
    expect(
      updatePropertyRequestSchema.safeParse({
        anuncio: { ...listing, comodidades: ['INEXISTENTE'] },
      }).success,
    ).toBe(false)
    expect(
      updatePropertyRequestSchema.safeParse({ anuncio: { ...listing, status: 'PUBLISHED' } })
        .success,
    ).toBe(false)
  })

  it('keeps listing fields absent on unrelated patches', () => {
    expect(updatePropertyRequestSchema.parse({ valor: 3000 })).toEqual({ valor: 3000 })
  })

  it.each([
    ['titulo', 200],
    ['descricao', 10000],
  ] as const)('enforces the approved text limit for %s', (field, limit) => {
    expect(updatePropertyRequestSchema.safeParse({ [field]: 'a'.repeat(limit) }).success).toBe(true)
    expect(updatePropertyRequestSchema.safeParse({ [field]: 'a'.repeat(limit + 1) }).success).toBe(
      false,
    )
  })

  it('enforces the approved negotiation terms limit', () => {
    expect(
      updatePropertyRequestSchema.safeParse({
        anuncio: { ...listing, condicoesNegociacao: 'a'.repeat(2000) },
      }).success,
    ).toBe(true)
    expect(
      updatePropertyRequestSchema.safeParse({
        anuncio: { ...listing, condicoesNegociacao: 'a'.repeat(2001) },
      }).success,
    ).toBe(false)
  })
})
