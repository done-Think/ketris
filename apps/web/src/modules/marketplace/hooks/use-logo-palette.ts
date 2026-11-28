'use client'

import { useQuery } from '@tanstack/react-query'

import { marketplaceQueryKeys } from '../config/marketplace-query-keys'
import { extractLogoPalette } from '../utils/logo-palette'

export function useLogoPalette(logoUrl: string) {
  return useQuery({
    queryKey: marketplaceQueryKeys.logoPalette(logoUrl),
    queryFn: () => extractLogoPalette(logoUrl),
    enabled: Boolean(logoUrl),
    staleTime: Infinity,
    retry: false,
  })
}
