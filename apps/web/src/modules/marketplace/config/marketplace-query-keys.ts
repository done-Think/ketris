import type { DirectoryListFilters } from '../types/directory'
import type { SearchPropertiesFilters } from '../types/public-property'
import { defaultHomePurpose } from './home'

export const marketplaceQueryKeys = {
  all: ['marketplace'] as const,
  stats: () => [...marketplaceQueryKeys.all, 'stats'] as const,
  viewerLocation: () => [...marketplaceQueryKeys.all, 'viewer-location'] as const,
  properties: () => [...marketplaceQueryKeys.all, 'properties'] as const,
  search: (filters: SearchPropertiesFilters) =>
    [...marketplaceQueryKeys.properties(), 'search', filters] as const,
  recent: (
    page: number,
    pageSize: number,
    purpose: SearchPropertiesFilters['purpose'] = defaultHomePurpose,
  ) => [...marketplaceQueryKeys.properties(), 'recent', page, pageSize, purpose] as const,
  brokers: (filters: DirectoryListFilters) =>
    [...marketplaceQueryKeys.all, 'brokers', filters] as const,
  broker: (id: string) => [...marketplaceQueryKeys.all, 'broker', id] as const,
  agencies: (filters: DirectoryListFilters) =>
    [...marketplaceQueryKeys.all, 'agencies', filters] as const,
  agency: (id: string) => [...marketplaceQueryKeys.all, 'agency', id] as const,
  own: (actorKey: string) => [...marketplaceQueryKeys.all, 'own', actorKey] as const,
  ownBroker: (actorKey: string) => [...marketplaceQueryKeys.own(actorKey), 'broker'] as const,
  ownAgency: (actorKey: string) => [...marketplaceQueryKeys.own(actorKey), 'agency'] as const,
  tenantAgents: (actorKey: string) =>
    [...marketplaceQueryKeys.own(actorKey), 'tenant-agents'] as const,
}
