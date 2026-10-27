import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { DIRECTORY_PAGE_SIZE } from '../config/directory'

import { agencyProfileService } from '../services/agency-profile-service'
import type { SaveAgencyProfileRequest } from '../types/public-agency-profile'
import { nextDirectoryPage } from '../utils/directory'

export const agencyProfileQueryKeys = {
  all: ['agency-profiles'] as const,
  list: (search: string) => [...agencyProfileQueryKeys.all, 'list', search] as const,
  detail: (id: string) => [...agencyProfileQueryKeys.all, id] as const,
  own: () => [...agencyProfileQueryKeys.all, 'own'] as const,
}

export function useAgencyProfiles(search: string) {
  return useInfiniteQuery({
    queryKey: agencyProfileQueryKeys.list(search),
    queryFn: ({ pageParam }) =>
      agencyProfileService.list({
        q: search || undefined,
        page: pageParam,
        pageSize: DIRECTORY_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: nextDirectoryPage,
    placeholderData: keepPreviousData,
  })
}

export function useAgencyProfile(id: string) {
  return useQuery({
    queryKey: agencyProfileQueryKeys.detail(id),
    queryFn: () => agencyProfileService.getById(id),
    enabled: Boolean(id),
  })
}

export function useOwnAgencyProfile() {
  return useQuery({
    queryKey: agencyProfileQueryKeys.own(),
    queryFn: () => agencyProfileService.getOwn(),
  })
}

export function useSaveAgencyProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SaveAgencyProfileRequest) => agencyProfileService.save(payload),
    onSuccess: (profile) => queryClient.setQueryData(agencyProfileQueryKeys.own(), profile),
  })
}

export function usePublishAgencyProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => agencyProfileService.publish(),
    onSuccess: (profile) => queryClient.setQueryData(agencyProfileQueryKeys.own(), profile),
  })
}

export function useUnpublishAgencyProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => agencyProfileService.unpublish(),
    onSuccess: (profile) => queryClient.setQueryData(agencyProfileQueryKeys.own(), profile),
  })
}
