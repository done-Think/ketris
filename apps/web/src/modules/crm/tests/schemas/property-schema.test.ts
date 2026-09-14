import { describe, expect, it } from 'vitest'

import {
  publicPropertyDetailSchema,
  publicPropertySearchFiltersSchema,
  publicPropertySummarySchema,
} from '../../schemas/property-schema'

const summary = {
  id: 'property-1',
  titulo: 'Apartamento Jardins',
  finalidade: 'ALUGUEL',
  tipo: 'apartamento',
  valor: 4800,
  condominio: 900,
  iptu: null,
  quartos: 2,
  banheiros: 2,
  vagas: 1,
  areaM2: 84,
  cidade: 'Sao Paulo',
  bairro: 'Jardins',
  capaUrl: 'https://cdn.example.com/property.jpg',
  publicadoEm: '2026-08-12T10:00:00.000Z',
}

describe('public property schemas', () => {
  it('accepts the existing public property summary contract', () => {
    expect(publicPropertySummarySchema.safeParse(summary).success).toBe(true)
  })

  it('accepts the existing public property detail contract', () => {
    const result = publicPropertyDetailSchema.safeParse({
      ...summary,
      descricao: 'Apartamento reformado.',
      endereco: {
        logradouro: 'Alameda Santos',
        numero: '1000',
        complemento: null,
        bairro: 'Jardins',
        cidade: 'Sao Paulo',
        estado: 'SP',
        cep: '01418-100',
        latitude: -23.56,
        longitude: -46.65,
      },
      midias: [{ id: 'media-1', url: summary.capaUrl, tipo: 'foto', ordem: 0 }],
    })

    expect(result.success).toBe(true)
  })

  it('validates only search filters accepted by the endpoint', () => {
    expect(
      publicPropertySearchFiltersSchema.safeParse({
        finalidade: 'ALUGUEL',
        precoMax: 5000,
        quartosMin: 2,
        q: 'Jardins',
      }).success,
    ).toBe(true)
    expect(publicPropertySearchFiltersSchema.safeParse({ finalidade: 'TEMPORADA' }).success).toBe(
      false,
    )
  })
})
