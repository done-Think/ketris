'use client'

import { useSearchParams } from 'next/navigation'

import { useRouter } from '@/i18n/navigation'

import { favoritesFiltersSchema } from '../schemas/favorites-filters-schema'
import type { FavoritesFilters } from '../types/favorite-property'

export function useFavoritesFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filters = favoritesFiltersSchema.parse({
    purpose: searchParams.get('purpose') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
  })

  function setFilters(changes: Partial<FavoritesFilters>) {
    const next = { ...filters, ...changes }
    router.replace(
      {
        pathname: '/favorites',
        query: {
          ...(next.purpose === 'all' ? {} : { purpose: next.purpose }),
          ...(next.sort === 'relevancia' ? {} : { sort: next.sort }),
        },
      },
      { scroll: false },
    )
  }

  return { filters, setFilters }
}
