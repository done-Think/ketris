import { FavoriteLimitReachedError, PropertyNotFoundError } from '../../domain/errors'
import { favoritePropertyLimit } from '../../domain/favorite-property'
import type { FavoritePropertyRepository } from '../ports/favorite-property-repository.port'
import type { PublicPropertyRepository } from '../ports/public-property-repository.port'
import type {
  FavoritePropertiesActorInput,
  FavoritePropertiesOutput,
  FavoritePropertyInput,
  FavoritePropertyKey,
  SavedFavoriteProperty,
} from '../../types/favorite-property'

function toKey({ actorId, actorTenantId, propertyId }: FavoritePropertyInput): FavoritePropertyKey {
  return { userId: actorId, tenantId: actorTenantId, propertyId }
}

export class FavoritePropertiesUseCase {
  constructor(
    private readonly favorites: FavoritePropertyRepository,
    private readonly properties: PublicPropertyRepository,
  ) {}

  async list({
    actorId,
    actorTenantId,
  }: FavoritePropertiesActorInput): Promise<FavoritePropertiesOutput> {
    const favorites = await this.favorites.list(
      { userId: actorId, tenantId: actorTenantId },
      favoritePropertyLimit,
    )
    return { favorites, limit: favoritePropertyLimit }
  }

  async save(input: FavoritePropertyInput): Promise<SavedFavoriteProperty> {
    const key = toKey(input)
    const existing = await this.favorites.find(key)
    if (existing) return existing

    const property = await this.properties.findPublishedById(key.propertyId)
    if (!property) throw new PropertyNotFoundError()

    if ((await this.favorites.count(key)) >= favoritePropertyLimit) {
      throw new FavoriteLimitReachedError(favoritePropertyLimit)
    }

    return this.favorites.save(key)
  }

  async remove(input: FavoritePropertyInput): Promise<void> {
    await this.favorites.remove(toKey(input))
  }
}
