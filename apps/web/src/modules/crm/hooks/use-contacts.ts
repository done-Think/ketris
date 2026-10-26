import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCrmCacheScope } from './use-crm-cache-scope'
import { crmQueryKeys } from './use-opportunities'

import { crmService } from '../services/crm-service'
import type { ContactFilters, UpdateContactInput } from '../types/contact'

function normalizeFilters(filters: ContactFilters) {
  return {
    ...filters,
    type: filters.type ?? null,
    q: filters.q ?? null,
    includeArchived: filters.includeArchived ?? false,
  }
}

export const crmContactQueryKeys = {
  all: ['crm', 'contacts'] as const,
  tenant: (tenantId: string) => [...crmContactQueryKeys.all, tenantId] as const,
  lists: (tenantId: string) => [...crmContactQueryKeys.tenant(tenantId), 'list'] as const,
  list: (tenantId: string, filters: ContactFilters = {}, actorKey: readonly string[] = []) =>
    [...crmContactQueryKeys.lists(tenantId), actorKey, normalizeFilters(filters)] as const,
  details: (tenantId: string) => [...crmContactQueryKeys.tenant(tenantId), 'detail'] as const,
  detail: (tenantId: string, contactId: string, actorKey: readonly string[] = []) =>
    [...crmContactQueryKeys.details(tenantId), contactId, actorKey] as const,
}

export function useContacts(tenantId: string | null | undefined, filters: ContactFilters = {}) {
  const scope = useCrmCacheScope(tenantId)
  const scopedTenantId = tenantId ?? ''

  return useQuery({
    queryKey: crmContactQueryKeys.list(scopedTenantId, filters, scope.actorKey),
    queryFn: () => crmService.listContacts(filters),
    enabled: scope.enabled,
  })
}

export function useContact(
  tenantId: string | null | undefined,
  contactId: string | null | undefined,
) {
  const scope = useCrmCacheScope(tenantId)
  const scopedTenantId = tenantId ?? ''
  const scopedContactId = contactId ?? ''

  return useQuery({
    queryKey: crmContactQueryKeys.detail(scopedTenantId, scopedContactId, scope.actorKey),
    queryFn: () => crmService.getContact(scopedContactId),
    enabled: scope.enabled && Boolean(contactId),
  })
}

export function useCreateContact(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: crmService.createContact.bind(crmService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmContactQueryKeys.lists(tenantId) })
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tenant(tenantId) })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}

export function useUpdateContact(tenantId: string) {
  const scope = useCrmCacheScope(tenantId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, changes }: UpdateContactInput) => crmService.updateContact(id, changes),
    onSuccess: (contact) => {
      queryClient.setQueryData(
        crmContactQueryKeys.detail(tenantId, contact.id, scope.actorKey),
        contact,
      )
      queryClient.invalidateQueries({ queryKey: crmContactQueryKeys.lists(tenantId) })
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tenant(tenantId) })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}

export function useArchiveContact(tenantId: string) {
  const scope = useCrmCacheScope(tenantId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (contactId: string) => crmService.archiveContact(contactId),
    onSuccess: (contact) => {
      queryClient.setQueryData(
        crmContactQueryKeys.detail(tenantId, contact.id, scope.actorKey),
        contact,
      )
      queryClient.invalidateQueries({ queryKey: crmContactQueryKeys.lists(tenantId) })
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tenant(tenantId) })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}

export function useCrmContactOptions(tenantId: string, q: string) {
  const scope = useCrmCacheScope(tenantId)
  return useInfiniteQuery({
    queryKey: [...crmContactQueryKeys.list(tenantId, { q }, scope.actorKey), 'options'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      crmService.listContacts({ q: q || undefined, page: pageParam, pageSize: 10 }),
    getNextPageParam: (page) =>
      page.pagination.page < page.pagination.pageCount ? page.pagination.page + 1 : undefined,
    select: (data) => data.pages.flatMap((page) => page.contacts),
    enabled: scope.enabled,
  })
}
