import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

import { propertiesService } from '../services/properties-service'
import type { QueryClient } from '@tanstack/react-query'
import type { PropertyFormValues, PropertyListFilters } from '../types/property'

export const propertyQueryKeys = {
  all: ['properties'] as const,
  mediaUpload: ['properties', 'mediaUpload'] as const,
  list: (
    tenantId: string | undefined,
    userId: string | undefined,
    role: string | undefined,
    filters: PropertyListFilters,
  ) => [...propertyQueryKeys.all, 'list', tenantId, userId, role, filters] as const,
  page: (
    tenantId: string | undefined,
    userId: string | undefined,
    role: string | undefined,
    filters: PropertyListFilters,
  ) => [...propertyQueryKeys.all, 'page', tenantId, userId, role, filters] as const,
  detail: (id: string) => [...propertyQueryKeys.all, id] as const,
}

export function useProperties(filters: PropertyListFilters = {}) {
  const { data: session } = useSession()
  return useQuery({
    queryKey: propertyQueryKeys.list(session?.tenantId, session?.user?.id, session?.role, filters),
    queryFn: () => propertiesService.list(filters),
    enabled: Boolean(session?.tenantId),
  })
}

export function usePropertyPage(filters: PropertyListFilters) {
  const { data: session } = useSession()
  return useQuery({
    queryKey: propertyQueryKeys.page(session?.tenantId, session?.user?.id, session?.role, filters),
    queryFn: () => propertiesService.listPage(filters),
    enabled: Boolean(session?.tenantId),
    placeholderData: (previous, query) =>
      query?.queryKey[2] === session?.tenantId &&
      query?.queryKey[3] === session?.user?.id &&
      query?.queryKey[4] === session?.role
        ? previous
        : undefined,
  })
}

export function useProperty(id: string) {
  const { data: session } = useSession()
  return useQuery({
    queryKey: [
      ...propertyQueryKeys.detail(id),
      session?.tenantId,
      session?.user?.id,
      session?.role,
    ],
    queryFn: () => propertiesService.getById(id),
    enabled: Boolean(id) && Boolean(session?.tenantId),
  })
}

export function useCreateProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PropertyFormValues) => propertiesService.create(payload),
    onSuccess: () => invalidatePropertyConsumers(queryClient),
  })
}

export function useUpdateProperty(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<PropertyFormValues>) => propertiesService.update(id, payload),
    onSuccess: () => {
      invalidatePropertyConsumers(queryClient)
    },
  })
}

export function usePublishProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => propertiesService.publish(id),
    onSuccess: () => {
      invalidatePropertyConsumers(queryClient)
    },
  })
}

export function useUnpublishProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => propertiesService.unpublish(id),
    onSuccess: () => {
      invalidatePropertyConsumers(queryClient)
    },
  })
}

export function useDeleteProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => propertiesService.remove(id),
    onSuccess: (_data, id) => {
      invalidatePropertyConsumers(queryClient)
      queryClient.removeQueries({ queryKey: propertyQueryKeys.detail(id) })
    },
  })
}

export function useUploadPropertyMediaBatch() {
  return useMutation({
    mutationKey: propertyQueryKeys.mediaUpload,
    mutationFn: (files: File[]) =>
      Promise.allSettled(files.map((file) => propertiesService.uploadMedia(file))),
  })
}

export function usePropertyMediaUploadsPending() {
  return useIsMutating({ mutationKey: propertyQueryKeys.mediaUpload }) > 0
}

export function usePropertyOwners(enabled = true) {
  const { data: session } = useSession()
  return useQuery({
    queryKey: [
      ...propertyQueryKeys.all,
      'owners',
      session?.tenantId,
      session?.user?.id,
      session?.role,
    ],
    queryFn: () => propertiesService.listOwners(),
    enabled:
      enabled &&
      Boolean(session?.tenantId) &&
      (session?.role === 'OWNER' || session?.role === 'AGENT'),
  })
}

function invalidatePropertyConsumers(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: propertyQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: ['agenda'] }),
    queryClient.invalidateQueries({ queryKey: ['contracts'] }),
    queryClient.invalidateQueries({ queryKey: ['marketplace', 'properties'] }),
  ])
}
