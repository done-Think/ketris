import { BaseService } from '@shared/lib/api/base-service'

import type { FavoritePropertiesResponse, SavedFavoriteProperty } from '../types/favorite-property'

function favoritePath(propertyId: string) {
  return `/marketplace/favorites/${encodeURIComponent(propertyId)}`
}

export class FavoritePropertiesService extends BaseService {
  list() {
    return this.http.get<FavoritePropertiesResponse>('/marketplace/favorites')
  }

  save(propertyId: string) {
    return this.http.put<SavedFavoriteProperty>(favoritePath(propertyId))
  }

  remove(propertyId: string) {
    return this.http.delete<void>(favoritePath(propertyId))
  }
}

export const favoritePropertiesService = new FavoritePropertiesService()
