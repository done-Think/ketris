import { afterEach, describe, expect, it } from 'vitest'
import { readMaintenanceDraft } from '../../utils/maintenance-draft'

const key = 'maintenance-draft:v1:tenant:user'

function saveDraft(category: string) {
  window.localStorage.setItem(
    key,
    JSON.stringify({
      contractId: 'c1',
      propertyId: 'p1',
      category,
      priority: 'normal',
      title: 'Leak',
      description: 'Kitchen leak',
    }),
  )
}

describe('maintenance draft category', () => {
  afterEach(() => window.localStorage.clear())

  it('keeps category codes', () => {
    saveDraft('ELECTRICAL')
    expect(readMaintenanceDraft(key)?.category).toBe('ELECTRICAL')
  })

  it('maps labels saved before categories became codes', () => {
    saveDraft('Hidráulica')
    expect(readMaintenanceDraft(key)?.category).toBe('PLUMBING')
  })

  it('clears unknown categories so the form asks for one again', () => {
    saveDraft('Jardinagem')
    expect(readMaintenanceDraft(key)?.category).toBe('')
  })
})
