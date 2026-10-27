import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { marketplaceQueryKeys } from '../config/marketplace-query-keys'
import { useMarketplaceActorKey } from './use-marketplace-actor-key'

import { agencyProfileService } from '../services/agency-profile-service'
import type { SaveAgencyProfileRequest } from '../types/public-agency-profile'

export function useOwnAgencyProfile() {
  const actorKey = useMarketplaceActorKey()

  return useQuery({
    queryKey: marketplaceQueryKeys.ownAgency(actorKey),
    queryFn: () => agencyProfileService.getOwn(),
  })
}

export function useSaveAgencyProfile() {
  const queryClient = useQueryClient()
  const actorKey = useMarketplaceActorKey()

  return useMutation({
    mutationFn: (payload: SaveAgencyProfileRequest) => agencyProfileService.save(payload),
    onSuccess: (profile) =>
      queryClient.setQueryData(marketplaceQueryKeys.ownAgency(actorKey), profile),
  })
}

export function usePublishAgencyProfile() {
  const queryClient = useQueryClient()
  const actorKey = useMarketplaceActorKey()

  return useMutation({
    mutationFn: () => agencyProfileService.publish(),
    onSuccess: (profile) =>
      queryClient.setQueryData(marketplaceQueryKeys.ownAgency(actorKey), profile),
  })
}

export function useUnpublishAgencyProfile() {
  const queryClient = useQueryClient()
  const actorKey = useMarketplaceActorKey()

  return useMutation({
    mutationFn: () => agencyProfileService.unpublish(),
    onSuccess: (profile) =>
      queryClient.setQueryData(marketplaceQueryKeys.ownAgency(actorKey), profile),
  })
}
