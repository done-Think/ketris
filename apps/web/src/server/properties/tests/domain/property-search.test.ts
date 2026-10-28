import { describe, expect, it } from 'vitest'
import { matchingPropertyTypes } from '../../domain/property-search'

describe('localized property search with English enum values', () => {
  it.each(['cobertura', 'penthouse', 'ático'])('preserves the human search term %s', (term) => {
    expect(matchingPropertyTypes(term)).toEqual(['PENTHOUSE'])
  })
})
