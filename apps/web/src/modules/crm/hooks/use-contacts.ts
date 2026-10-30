import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  tenant: (tenantId: string | undefined) => [...crmContactQueryKeys.all, tenantId] as const,
  lists: (tenantId: string | undefined) =>
    [...crmContactQueryKeys.tenant(tenantId), 'list'] as const,
  list: (
    tenantId: string | undefined,
    filters: ContactFilters = {},
    actorKey: readonly string[] = [],
  ) => [...crmContactQueryKeys.lists(tenantId), actorKey, normalizeFilters(filters)] as const,
  details: (tenantId: string | undefined) =>
    [...crmContactQueryKeys.tenant(tenantId), 'detail'] as const,
  detail: (tenantId: string | undefined, contactId: string, actorKey: readonly string[] = []) =>
    [...crmContactQueryKeys.details(tenantId), contactId, actorKey] as const,
}

export function useContacts(filters: ContactFilters = {}) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  return useQuery({
    queryKey: crmContactQueryKeys.list(tenantId, filters, scope.actorKey),
    queryFn: () => crmService.listContacts(filters),
    enabled: scope.enabled,
  })
}

export function useContact(contactId: string | null | undefined) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const scopedContactId = contactId ?? ''

  return useQuery({
    queryKey: crmContactQueryKeys.detail(tenantId, scopedContactId, scope.actorKey),
    queryFn: () => crmService.getContact(scopedContactId),
    enabled: scope.enabled && Boolean(contactId),
  })
}

export function useCreateContact() {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
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

export function useUpdateContact() {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, changes }: UpdateContactInput) => crmService.updateContact(id, changes),
    onMutate: () => ({ tenantId, actorKey: scope.actorKey }),
    onSuccess: (contact, _input, originalScope) => {
      if (!originalScope) return
      const { tenantId, actorKey } = originalScope
      queryClient.setQueryData(crmContactQueryKeys.detail(tenantId, contact.id, actorKey), contact)
      queryClient.invalidateQueries({ queryKey: crmContactQueryKeys.lists(tenantId) })
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tenant(tenantId) })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}

export function useArchiveContact() {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (contactId: string) => crmService.archiveContact(contactId),
    onMutate: () => ({ tenantId, actorKey: scope.actorKey }),
    onSuccess: (contact, _input, originalScope) => {
      if (!originalScope) return
      const { tenantId, actorKey } = originalScope
      queryClient.setQueryData(crmContactQueryKeys.detail(tenantId, contact.id, actorKey), contact)
      queryClient.invalidateQueries({ queryKey: crmContactQueryKeys.lists(tenantId) })
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tenant(tenantId) })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}

export function useCrmContactOptions(q: string) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  return useInfiniteQuery({
    queryKey: [...crmContactQueryKeys.list(tenantId, { q }, scope.actorKey), 'options'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      crmService.listContacts({ q: q || undefined, page: pageParam, pageSize: 10 }),
    getNextPageParam: (page) =>
      page.pagination.page < page.pagination.pageCount ? page.pagination.page + 1 : undefined,
    select: (data) => data.pages.flatMap((page) => page.contacts),
    enabled: scope.enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}
