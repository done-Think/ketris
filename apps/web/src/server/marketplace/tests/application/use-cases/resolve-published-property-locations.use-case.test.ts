import { describe, expect, it, vi } from 'vitest'
import { unavailableAddressGeocoder } from '@server/shared/location/address-geocoder.port'
import { ResolvePublishedPropertyLocationsUseCase } from '../../../application/use-cases/resolve-published-property-locations.use-case'
import type { PropertyLocationCandidate } from '../../../application/ports/published-property-location-repository.port'

const address = {
  street: 'Rua das Flores',
  number: '10',
  complement: null,
  neighborhood: 'Centro',
  city: 'Curitiba',
  state: 'PR',
  zipCode: '80000000',
  latitude: null,
  longitude: null,
}
const candidate: PropertyLocationCandidate = {
  propertyId: 'property-1',
  address,
  updatedAt: new Date(),
}

function setup(candidates = [candidate]) {
  const repository = {
    findCandidates: vi.fn().mockResolvedValue(candidates),
    saveResult: vi.fn().mockResolvedValue(true),
  }
  const geocoder = { locate: vi.fn().mockResolvedValue({ latitude: -25.4, longitude: -49.2 }) }
  return {
    repository,
    geocoder,
    useCase: new ResolvePublishedPropertyLocationsUseCase(repository, geocoder),
  }
}

describe('resolving published property locations', () => {
  it('resolves and persists only the addresses of the current results', async () => {
    const { repository, geocoder, useCase } = setup()
    expect(await useCase.execute(['property-1'])).toEqual({ changed: true, pending: false })
    expect(repository.findCandidates).toHaveBeenCalledWith(['property-1'], 3)
    expect(geocoder.locate).toHaveBeenCalledWith(address)
    expect(repository.saveResult).toHaveBeenCalledWith(candidate, {
      latitude: -25.4,
      longitude: -49.2,
    })
  })
  it('limits work to two addresses and reports pending candidates for the next response', async () => {
    const { repository, geocoder, useCase } = setup([
      candidate,
      { ...candidate, propertyId: 'property-2' },
      { ...candidate, propertyId: 'property-3' },
    ])
    expect(await useCase.execute(['property-1', 'property-2', 'property-3'])).toEqual({
      changed: true,
      pending: true,
    })
    expect(geocoder.locate).toHaveBeenCalledTimes(2)
    expect(repository.saveResult).toHaveBeenCalledTimes(2)
  })
  it('records unsuccessful attempts without inventing coordinates', async () => {
    const { repository, geocoder, useCase } = setup()
    geocoder.locate.mockResolvedValue(null)
    await useCase.execute(['property-1'])
    expect(repository.saveResult).toHaveBeenCalledWith(candidate, null)
  })
  it('re-reads after an address conflict and skips disabled or empty work', async () => {
    const { repository, useCase } = setup()
    repository.saveResult.mockResolvedValue(false)
    expect((await useCase.execute(['property-1'])).changed).toBe(true)
    repository.findCandidates.mockClear()
    await useCase.execute([])
    await new ResolvePublishedPropertyLocationsUseCase(
      repository,
      unavailableAddressGeocoder,
    ).execute(['property-1'])
    expect(repository.findCandidates).not.toHaveBeenCalled()
  })
})
