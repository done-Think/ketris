import { useQuery } from '@tanstack/react-query'

import {
  HOME_FEATURED_PROPERTIES_COUNT,
  HOME_MINI_PROPERTIES_COUNT,
} from '../config/home-properties'
import { publicPropertyQueryKeys } from '../config/property-query-keys'
import { marketplaceService } from '../services/marketplace-service'
import { mapSummaryToMiniProperty } from '../utils/property-summary-adapter'

// The properties right after the featured ones, so the two home sections never repeat.
const miniPropertiesPage = HOME_FEATURED_PROPERTIES_COUNT / HOME_MINI_PROPERTIES_COUNT + 1

export function useMiniProperties() {
  const query = useQuery({
    queryKey: publicPropertyQueryKeys.mini(),
    queryFn: () =>
      marketplaceService.searchProperties({
        sortBy: 'recent',
        page: miniPropertiesPage,
        pageSize: HOME_MINI_PROPERTIES_COUNT,
      }),
  })

  return {
    miniProperties: (query.data?.properties ?? []).map(mapSummaryToMiniProperty),
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
