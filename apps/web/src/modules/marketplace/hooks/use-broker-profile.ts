import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { marketplaceQueryKeys } from '../config/marketplace-query-keys'
import { useMarketplaceActorKey } from './use-marketplace-actor-key'

import { brokerProfileService } from '../services/broker-profile-service'
import type { SaveBrokerProfileRequest } from '../types/public-broker-profile'

export function useOwnBrokerProfile() {
  const actorKey = useMarketplaceActorKey()

  return useQuery({
    queryKey: marketplaceQueryKeys.ownBroker(actorKey),
    queryFn: () => brokerProfileService.getOwn(),
  })
}

export function useSaveBrokerProfile() {
  const queryClient = useQueryClient()
  const actorKey = useMarketplaceActorKey()

  return useMutation({
    mutationFn: (payload: SaveBrokerProfileRequest) => brokerProfileService.save(payload),
    onSuccess: (profile) =>
      queryClient.setQueryData(marketplaceQueryKeys.ownBroker(actorKey), profile),
  })
}

export function usePublishBrokerProfile() {
  const queryClient = useQueryClient()
  const actorKey = useMarketplaceActorKey()

  return useMutation({
    mutationFn: () => brokerProfileService.publish(),
    onSuccess: (profile) =>
      queryClient.setQueryData(marketplaceQueryKeys.ownBroker(actorKey), profile),
  })
}

export function useUnpublishBrokerProfile() {
  const queryClient = useQueryClient()
  const actorKey = useMarketplaceActorKey()

  return useMutation({
    mutationFn: () => brokerProfileService.unpublish(),
    onSuccess: (profile) =>
      queryClient.setQueryData(marketplaceQueryKeys.ownBroker(actorKey), profile),
  })
}
