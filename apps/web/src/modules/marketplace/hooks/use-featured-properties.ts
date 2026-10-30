import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'

import type { AppLocale } from '@/i18n/types/locale.types'

import {
  featuredPropertiesCount,
  defaultSearchPurpose,
  apiPurposeBySearchPurpose,
} from '../config/home'
import type { SearchResultPurposeParam } from '../types/search'
import { marketplaceQueryKeys } from '../config/marketplace-query-keys'
import { marketplaceService } from '../services/marketplace-service'
import { mapSummaryToSearchResult } from '../utils/property-summary-adapter'

export function useRecentProperties(
  page: number,
  pageSize = featuredPropertiesCount,
  purpose: SearchResultPurposeParam = defaultSearchPurpose,
) {
  const locale = useLocale() as AppLocale
  const tFeatures = useTranslations('marketplace.propertyFeatures')
  const query = useQuery({
    queryKey: marketplaceQueryKeys.recent(page, pageSize, apiPurposeBySearchPurpose[purpose]),
    queryFn: () =>
      marketplaceService.searchProperties({
        purpose: apiPurposeBySearchPurpose[purpose],
        sortBy: 'recent',
        page,
        pageSize,
      }),
  })

  const properties = (query.data?.properties ?? []).map((summary) =>
    mapSummaryToSearchResult(summary, purpose === 'rent' ? 'alugar' : 'comprar', locale, tFeatures),
  )

  return { properties, isLoading: query.isLoading, isError: query.isError }
}

export function useFeaturedProperties(purpose: SearchResultPurposeParam = defaultSearchPurpose) {
  const { properties, isLoading, isError } = useRecentProperties(
    1,
    featuredPropertiesCount,
    purpose,
  )

  return { featuredProperties: properties, isLoading, isError }
}
