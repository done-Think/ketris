import { describe, expect, it } from 'vitest'

import { contactListFixtures } from '../../fixtures/contact-list-fixtures'
import { filterContacts, getContactFilterCount, paginateContacts } from '../../utils/contacts'

describe('filterContacts', () => {
  it.each([
    ['leticia ramos', 'Letícia Ramos'],
    ['RICARDO.MENDES@EMAIL', 'Ricardo Mendes'],
    ['98112', 'Heitor Prado'],
  ])('matches normalized query %s', (query, expectedName) => {
    expect(filterContacts(contactListFixtures, query).map((contact) => contact.name)).toEqual([
      expectedName,
    ])
  })

  it('filters contacts by type', () => {
    expect(
      filterContacts(contactListFixtures, '', 'Proprietário').map((contact) => contact.name),
    ).toEqual(['Sandra Vasconcellos', 'Ana Beatriz Ramos'])
  })

  it('combines text and type filters', () => {
    expect(filterContacts(contactListFixtures, 'ramos', 'Locatário')).toEqual([
      expect.objectContaining({ name: 'Letícia Ramos' }),
    ])
    expect(filterContacts(contactListFixtures, 'ramos', 'Corretor')).toEqual([])
  })

  it('returns every contact for an empty query and type', () => {
    expect(filterContacts(contactListFixtures, '   ')).toHaveLength(6)
  })
})

describe('paginateContacts', () => {
  it('returns a normalized page of contacts using the dashboard page size', () => {
    const result = paginateContacts(contactListFixtures)

    expect(result.items).toHaveLength(5)
    expect(result.page).toBe(1)
    expect(result.pageCount).toBe(2)
    expect(result.totalCount).toBe(6)
  })

  it('clamps invalid pages to the available range', () => {
    expect(paginateContacts(contactListFixtures, 99).page).toBe(2)
    expect(paginateContacts(contactListFixtures, -1).page).toBe(1)
  })
})

describe('getContactFilterCount', () => {
  it.each([
    ['Todos', 6],
    ['Proprietários', 2],
    ['Locatários', 3],
    ['Corretores', 1],
  ] as const)('counts contacts for the %s filter', (filter, expectedCount) => {
    expect(getContactFilterCount(contactListFixtures, filter)).toBe(expectedCount)
  })
})
