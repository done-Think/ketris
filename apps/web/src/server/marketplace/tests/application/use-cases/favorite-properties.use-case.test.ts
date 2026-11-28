import { describe, expect, it, vi } from 'vitest'

import { FavoriteLimitReachedError, PropertyNotFoundError } from '../../../domain/errors'
import { favoritePropertyLimit } from '../../../domain/favorite-property'
import type { FavoritePropertyRepository } from '../../../application/ports/favorite-property-repository.port'
import type { PublicPropertyRepository } from '../../../application/ports/public-property-repository.port'
import { FavoritePropertiesUseCase } from '../../../application/use-cases/favorite-properties.use-case'
import type { PublishedPropertyDetail } from '../../../types/property'

const input = { actorId: 'user-1', actorTenantId: 'tenant-1', propertyId: 'property-1' }
const key = { userId: 'user-1', tenantId: 'tenant-1', propertyId: 'property-1' }
const savedAt = new Date('2026-11-23T12:00:00.000Z')

function createUseCase(overrides: Partial<FavoritePropertyRepository> = {}, published = true) {
  const favorites: FavoritePropertyRepository = {
    list: vi.fn().mockResolvedValue([]),
    find: vi.fn().mockResolvedValue(null),
    count: vi.fn().mockResolvedValue(0),
    save: vi.fn().mockResolvedValue({ propertyId: 'property-1', savedAt }),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  const properties: PublicPropertyRepository = {
    search: vi.fn(),
    findPublishedById: vi
      .fn()
      .mockResolvedValue(published ? ({ id: 'property-1' } as PublishedPropertyDetail) : null),
  }
  return { useCase: new FavoritePropertiesUseCase(favorites, properties), favorites, properties }
}

describe('FavoritePropertiesUseCase', () => {
  it('lists only the actor favorites, up to the limit', async () => {
    const { useCase, favorites } = createUseCase()

    await expect(useCase.list(input)).resolves.toEqual({
      favorites: [],
      limit: favoritePropertyLimit,
    })
    expect(favorites.list).toHaveBeenCalledWith(
      { userId: 'user-1', tenantId: 'tenant-1' },
      favoritePropertyLimit,
    )
  })

  it('saves a published property for the actor and its tenant', async () => {
    const { useCase, favorites } = createUseCase()

    await expect(useCase.save(input)).resolves.toEqual({ propertyId: 'property-1', savedAt })
    expect(favorites.save).toHaveBeenCalledWith(key)
  })

  it('returns the original date when the property was already saved', async () => {
    const original = { propertyId: 'property-1', savedAt: new Date('2026-11-01T00:00:00.000Z') }
    const { useCase, favorites, properties } = createUseCase({
      find: vi.fn().mockResolvedValue(original),
    })

    await expect(useCase.save(input)).resolves.toBe(original)
    expect(properties.findPublishedById).not.toHaveBeenCalled()
    expect(favorites.save).not.toHaveBeenCalled()
  })

  it('refuses a property that is missing or not published', async () => {
    const { useCase, favorites } = createUseCase({}, false)

    await expect(useCase.save(input)).rejects.toBeInstanceOf(PropertyNotFoundError)
    expect(favorites.save).not.toHaveBeenCalled()
  })

  it('refuses a new favorite when the limit is reached', async () => {
    const { useCase, favorites } = createUseCase({
      count: vi.fn().mockResolvedValue(favoritePropertyLimit),
    })

    await expect(useCase.save(input)).rejects.toBeInstanceOf(FavoriteLimitReachedError)
    expect(favorites.save).not.toHaveBeenCalled()
  })

  it('removes only the actor favorite', async () => {
    const { useCase, favorites } = createUseCase()

    await useCase.remove(input)

    expect(favorites.remove).toHaveBeenCalledWith(key)
  })
})
