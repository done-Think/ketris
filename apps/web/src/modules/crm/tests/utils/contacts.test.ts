import { describe, expect, it } from 'vitest'

import { contactListFixtures } from '../../fixtures/contact-list-fixtures'
import { filterContacts } from '../../utils/contacts'

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
