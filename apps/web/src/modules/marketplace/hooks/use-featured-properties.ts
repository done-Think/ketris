import { useQuery } from '@tanstack/react-query'

import { marketplaceService } from '../services/marketplace-service'
import { mapSummaryToSearchResult } from '../utils/property-summary-adapter'

const featuredPropertiesCount = 6

export function useFeaturedProperties() {
  const query = useQuery({
    queryKey: ['marketplace', 'properties', 'featured'],
    queryFn: () => marketplaceService.searchProperties({ sortBy: 'recent' }),
  })

  const featuredProperties = (query.data ?? [])
    .slice(0, featuredPropertiesCount)
    .map((summary) =>
      mapSummaryToSearchResult(summary, summary.purpose === 'ALUGUEL' ? 'alugar' : 'comprar'),
    )

  return { featuredProperties, isLoading: query.isLoading, isError: query.isError }
}
