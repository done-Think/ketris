import type {
  FavoritePropertyEntry,
  FavoritePropertyKey,
  FavoritePropertyOwner,
  SavedFavoriteProperty,
} from '../../types/favorite-property'

export interface FavoritePropertyRepository {
  list(owner: FavoritePropertyOwner, limit: number): Promise<FavoritePropertyEntry[]>
  find(key: FavoritePropertyKey): Promise<SavedFavoriteProperty | null>
  count(owner: FavoritePropertyOwner): Promise<number>
  save(key: FavoritePropertyKey): Promise<SavedFavoriteProperty>
  remove(key: FavoritePropertyKey): Promise<void>
}
