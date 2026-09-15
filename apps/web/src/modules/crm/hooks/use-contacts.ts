import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { crmService } from '../services/crm-service'
import type { ContactFilters, UpdateContactPayload } from '../types/contact'

function normalizeFilters(filters: ContactFilters) {
  return {
    type: filters.type ?? null,
    q: filters.q ?? null,
    includeArchived: filters.includeArchived ?? false,
  }
}

export const crmContactQueryKeys = {
  all: ['crm', 'contacts'] as const,
  tenant: (tenantId: string) => [...crmContactQueryKeys.all, tenantId] as const,
  lists: (tenantId: string) => [...crmContactQueryKeys.tenant(tenantId), 'list'] as const,
  list: (tenantId: string, filters: ContactFilters = {}) =>
    [...crmContactQueryKeys.lists(tenantId), normalizeFilters(filters)] as const,
  details: (tenantId: string) => [...crmContactQueryKeys.tenant(tenantId), 'detail'] as const,
  detail: (tenantId: string, contactId: string) =>
    [...crmContactQueryKeys.details(tenantId), contactId] as const,
}

export function useContacts(tenantId: string | null | undefined, filters: ContactFilters = {}) {
  const scopedTenantId = tenantId ?? ''

  return useQuery({
    queryKey: crmContactQueryKeys.list(scopedTenantId, filters),
    queryFn: () => crmService.listContacts(filters),
    enabled: Boolean(tenantId),
  })
}

export function useContact(
  tenantId: string | null | undefined,
  contactId: string | null | undefined,
) {
  const scopedTenantId = tenantId ?? ''
  const scopedContactId = contactId ?? ''

  return useQuery({
    queryKey: crmContactQueryKeys.detail(scopedTenantId, scopedContactId),
    queryFn: () => crmService.getContact(scopedContactId),
    enabled: Boolean(tenantId && contactId),
  })
}

export function useCreateContact(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: crmService.createContact.bind(crmService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmContactQueryKeys.lists(tenantId) })
    },
  })
}

export interface UpdateContactInput {
  id: string
  changes: UpdateContactPayload
}

export function useUpdateContact(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, changes }: UpdateContactInput) => crmService.updateContact(id, changes),
    onSuccess: (contact) => {
      queryClient.setQueryData(crmContactQueryKeys.detail(tenantId, contact.id), contact)
      queryClient.invalidateQueries({ queryKey: crmContactQueryKeys.lists(tenantId) })
    },
  })
}

export function useArchiveContact(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (contactId: string) => crmService.archiveContact(contactId),
    onSuccess: (contact) => {
      queryClient.setQueryData(crmContactQueryKeys.detail(tenantId, contact.id), contact)
      queryClient.invalidateQueries({ queryKey: crmContactQueryKeys.lists(tenantId) })
    },
  })
}
