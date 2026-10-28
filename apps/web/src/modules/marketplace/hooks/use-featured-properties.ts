import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'

import type { AppLocale } from '@/i18n/types/locale.types'

import { featuredPropertiesCount } from '../config/home'
import { marketplaceQueryKeys } from '../config/marketplace-query-keys'
import { marketplaceService } from '../services/marketplace-service'
import { mapSummaryToSearchResult } from '../utils/property-summary-adapter'

export function useRecentProperties(page: number, pageSize = featuredPropertiesCount) {
  const locale = useLocale() as AppLocale
  const tFeatures = useTranslations('marketplace.propertyFeatures')
  const query = useQuery({
    queryKey: marketplaceQueryKeys.recent(page, pageSize),
    queryFn: () => marketplaceService.searchProperties({ sortBy: 'recent', page, pageSize }),
  })

  const properties = (query.data?.properties ?? []).map((summary) =>
    mapSummaryToSearchResult(
      summary,
      summary.purpose === 'RENT' ? 'alugar' : 'comprar',
      locale,
      tFeatures,
    ),
  )

  return { properties, isLoading: query.isLoading, isError: query.isError }
}

export function useFeaturedProperties() {
  const { properties, isLoading, isError } = useRecentProperties(1)

  return { featuredProperties: properties, isLoading, isError }
}
