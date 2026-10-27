import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'

import { HOME_FEATURED_PROPERTIES_COUNT } from '../config/home-properties'
import { publicPropertyQueryKeys } from '../config/property-query-keys'
import { marketplaceService } from '../services/marketplace-service'
import { mapSummaryToSearchResult } from '../utils/property-summary-adapter'

export function useFeaturedProperties() {
  const locale = useLocale() as AppLocale
  const tFeatures = useTranslations('marketplace.propertyFeatures')
  const query = useQuery({
    queryKey: publicPropertyQueryKeys.featured(),
    queryFn: () =>
      marketplaceService.searchProperties({
        sortBy: 'recent',
        pageSize: HOME_FEATURED_PROPERTIES_COUNT,
      }),
  })

  const featuredProperties = (query.data?.properties ?? []).map((summary) =>
    mapSummaryToSearchResult(
      summary,
      summary.purpose === 'ALUGUEL' ? 'alugar' : 'comprar',
      locale,
      tFeatures,
    ),
  )

  return { featuredProperties, isLoading: query.isLoading, isError: query.isError }
}
