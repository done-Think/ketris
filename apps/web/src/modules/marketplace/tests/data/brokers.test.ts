import { describe, expect, it } from 'vitest'

import { agencies } from '../../data/agencies'
import { getBrokersByNames } from '../../data/brokers'

describe('broker data helpers', () => {
  it('resolves every agency highlighted team member to a broker profile', () => {
    agencies.forEach((agency) => {
      expect(getBrokersByNames(agency.teamHighlights).map((broker) => broker.name)).toEqual(
        agency.teamHighlights,
      )
    })
  })
})
