import { describe, expect, it } from 'vitest'

import type { Opportunity } from '../types/opportunity'
import { buildContactsFromOpportunities, filterContacts } from './contacts'

function makeOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 'opportunity-1',
    tenantId: 'tenant-1',
    imovelId: 'property-1',
    interessadoNome: 'Maria Silva',
    interessadoEmail: 'maria@example.com',
    interessadoTelefone: null,
    valorProposto: 4800,
    prazoContratoMeses: null,
    inicioPretendido: null,
    garantiaContratual: 'NENHUMA',
    condicoesEspeciais: [],
    observacoes: null,
    status: 'ENVIADA',
    arquivadaEm: null,
    createdAt: '2026-08-10T10:00:00.000Z',
    updatedAt: '2026-08-10T10:00:00.000Z',
    ...overrides,
  }
}

describe('buildContactsFromOpportunities', () => {
  it('deduplicates by normalized e-mail and aggregates unique properties', () => {
    const older = makeOpportunity({
      id: 'opportunity-older',
      imovelId: 'property-1',
      interessadoEmail: ' MARIA@EXAMPLE.COM ',
      interessadoTelefone: '(11) 99999-0000',
    })
    const newer = makeOpportunity({
      id: 'opportunity-newer',
      imovelId: 'property-2',
      interessadoNome: 'Maria Atualizada',
      interessadoEmail: 'maria@example.com',
      status: 'EM_NEGOCIACAO',
      updatedAt: '2026-08-12T10:00:00.000Z',
    })
    const repeatedProperty = makeOpportunity({
      id: 'opportunity-repeated-property',
      imovelId: 'property-2',
      interessadoEmail: 'Maria@Example.com',
      updatedAt: '2026-08-11T10:00:00.000Z',
    })

    const contacts = buildContactsFromOpportunities([older, newer, repeatedProperty])

    expect(contacts).toHaveLength(1)
    expect(contacts[0]).toMatchObject({
      id: 'maria@example.com',
      name: 'Maria Atualizada',
      email: 'maria@example.com',
      phone: '(11) 99999-0000',
      type: 'Interessado',
      propertyIds: ['property-2', 'property-1'],
      latestInteractionAt: newer.updatedAt,
      latestOpportunityId: newer.id,
      latestStatus: 'EM_NEGOCIACAO',
    })
    expect(contacts[0].opportunityIds).toHaveLength(3)
  })

  it('sorts contacts by the latest interaction', () => {
    const older = makeOpportunity({
      id: 'older',
      interessadoNome: 'Contato antigo',
      interessadoEmail: 'old@example.com',
      updatedAt: '2026-08-10T10:00:00.000Z',
    })
    const newer = makeOpportunity({
      id: 'newer',
      interessadoNome: 'Contato recente',
      interessadoEmail: 'new@example.com',
      updatedAt: '2026-08-12T10:00:00.000Z',
    })

    expect(buildContactsFromOpportunities([older, newer]).map((contact) => contact.name)).toEqual([
      'Contato recente',
      'Contato antigo',
    ])
  })
})

describe('filterContacts', () => {
  const contacts = buildContactsFromOpportunities([
    makeOpportunity({
      interessadoNome: 'João Álvares',
      interessadoEmail: 'joao@example.com',
      interessadoTelefone: '(11) 98888-1111',
    }),
    makeOpportunity({
      id: 'opportunity-2',
      interessadoNome: 'Ana Souza',
      interessadoEmail: 'ana@example.com',
    }),
  ])

  it.each(['joao alvares', 'JOAO@EXAMPLE', '98888'])('matches normalized query %s', (query) => {
    expect(filterContacts(contacts, query).map((contact) => contact.email)).toEqual([
      'joao@example.com',
    ])
  })

  it('returns every contact for an empty query', () => {
    expect(filterContacts(contacts, '   ')).toHaveLength(2)
  })
})
