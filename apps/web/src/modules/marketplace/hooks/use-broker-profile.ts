import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { DIRECTORY_PAGE_SIZE } from '../config/directory'

import { brokerProfileService } from '../services/broker-profile-service'
import type { SaveBrokerProfileRequest } from '../types/public-broker-profile'
import { nextDirectoryPage } from '../utils/directory'

export const brokerProfileQueryKeys = {
  all: ['broker-profiles'] as const,
  list: (search: string) => [...brokerProfileQueryKeys.all, 'list', search] as const,
  detail: (id: string) => [...brokerProfileQueryKeys.all, id] as const,
  own: () => [...brokerProfileQueryKeys.all, 'own'] as const,
}

export function useBrokerProfiles(search: string) {
  return useInfiniteQuery({
    queryKey: brokerProfileQueryKeys.list(search),
    queryFn: ({ pageParam }) =>
      brokerProfileService.list({
        q: search || undefined,
        page: pageParam,
        pageSize: DIRECTORY_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: nextDirectoryPage,
    placeholderData: keepPreviousData,
  })
}

export function useBrokerProfile(id: string) {
  return useQuery({
    queryKey: brokerProfileQueryKeys.detail(id),
    queryFn: () => brokerProfileService.getById(id),
    enabled: Boolean(id),
  })
}

export function useOwnBrokerProfile() {
  return useQuery({
    queryKey: brokerProfileQueryKeys.own(),
    queryFn: () => brokerProfileService.getOwn(),
  })
}

export function useSaveBrokerProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SaveBrokerProfileRequest) => brokerProfileService.save(payload),
    onSuccess: (profile) => queryClient.setQueryData(brokerProfileQueryKeys.own(), profile),
  })
}

export function usePublishBrokerProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => brokerProfileService.publish(),
    onSuccess: (profile) => queryClient.setQueryData(brokerProfileQueryKeys.own(), profile),
  })
}

export function useUnpublishBrokerProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => brokerProfileService.unpublish(),
    onSuccess: (profile) => queryClient.setQueryData(brokerProfileQueryKeys.own(), profile),
  })
}
