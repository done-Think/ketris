import type {
  Finalidade,
  PublishedPropertyDetail,
  PublishedPropertySummary,
} from '../../domain/property.entity'

export interface PropertySearchFilters {
  finalidade?: Finalidade
  tipo?: string
  cidade?: string
  precoMin?: number
  precoMax?: number
  quartosMin?: number
  q?: string
}

export interface PublicPropertyRepository {
  search(filters: PropertySearchFilters): Promise<PublishedPropertySummary[]>
  findPublishedById(id: string): Promise<PublishedPropertyDetail | null>
}
