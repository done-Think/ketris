import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { marketplaceQueryKeys } from '../config/marketplace-query-keys'
import { profileAddressService } from '../services/profile-address-service'
import type { PublicProfileKind } from '../types/profile-address'
import { useMarketplaceActorKey } from './use-marketplace-actor-key'

export function useOwnProfileAddress(kind: PublicProfileKind) {
  const actorKey = useMarketplaceActorKey()
  return useQuery({
    queryKey: marketplaceQueryKeys.ownAddress(actorKey, kind),
    queryFn: () => profileAddressService.getOwn(kind),
  })
}
export function useProfileAddressAvailability(kind: PublicProfileKind, handle: string | null) {
  const actorKey = useMarketplaceActorKey()
  return useQuery({
    queryKey: marketplaceQueryKeys.addressAvailability(actorKey, kind, handle),
    queryFn: () => profileAddressService.availability(kind, handle!),
    enabled: handle !== null,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}
export function useSaveProfileAddress(kind: PublicProfileKind) {
  const actorKey = useMarketplaceActorKey()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (handle: string) => profileAddressService.save(kind, handle),
    onMutate: () => ({ queryKey: marketplaceQueryKeys.ownAddress(actorKey, kind) }),
    onSuccess: async (address, _handle, context) => {
      if (!context) return
      await queryClient.cancelQueries({ queryKey: context.queryKey, exact: true })
      queryClient.setQueryData(context.queryKey, address)
    },
  })
}
