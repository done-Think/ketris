import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { PropertyFormValues } from '../schemas/property-schema'
import { propertiesService } from '../services/properties-service'

export const propertyQueryKeys = {
  all: ['properties'] as const,
  detail: (id: string) => [...propertyQueryKeys.all, id] as const,
}

export function useProperties() {
  return useQuery({
    queryKey: propertyQueryKeys.all,
    queryFn: () => propertiesService.list(),
  })
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: propertyQueryKeys.detail(id),
    queryFn: () => propertiesService.getById(id),
    enabled: Boolean(id),
  })
}

export function useCreateProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PropertyFormValues) => propertiesService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: propertyQueryKeys.all }),
  })
}

export function useUpdateProperty(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<PropertyFormValues>) => propertiesService.update(id, payload),
    onSuccess: (property) => {
      queryClient.invalidateQueries({ queryKey: propertyQueryKeys.all })
      queryClient.setQueryData(propertyQueryKeys.detail(property.id), property)
    },
  })
}

export function usePublishProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => propertiesService.publish(id),
    onSuccess: (property) => {
      queryClient.invalidateQueries({ queryKey: propertyQueryKeys.all })
      queryClient.setQueryData(propertyQueryKeys.detail(property.id), property)
    },
  })
}

export function useUnpublishProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => propertiesService.unpublish(id),
    onSuccess: (property) => {
      queryClient.invalidateQueries({ queryKey: propertyQueryKeys.all })
      queryClient.setQueryData(propertyQueryKeys.detail(property.id), property)
    },
  })
}
