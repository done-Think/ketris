import { useQuery } from '@tanstack/react-query'
import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'

import type { OverviewScope, SessionListQuery } from '../types'
import { isCaptureInFlight } from '../utils/session-status'

import { consoleService } from '../services/console-service'
import { consoleKeys } from './console-query-keys'

const livePollingMs = 3000

export function useSessionList(query: SessionListQuery) {
  const scope = useTenantSessionScope()
  return useQuery({
    queryKey: [...consoleKeys.sessionList(query), scope.tenantId, ...scope.actorKey],
    enabled: scope.enabled,
    queryFn: ({ signal }) => consoleService.listSessions(query, signal),
    staleTime: 0,
    refetchInterval: livePollingMs,
  })
}

export function useSession(id: string) {
  const scope = useTenantSessionScope()
  return useQuery({
    queryKey: [...consoleKeys.session(id), scope.tenantId, ...scope.actorKey],
    enabled: scope.enabled,
    queryFn: ({ signal }) => consoleService.getSession(id, signal),
    staleTime: 0,
    refetchInterval: (query) =>
      query.state.data && isCaptureInFlight(query.state.data.status) ? 1000 : livePollingMs,
  })
}

export function useOverview(overviewScope: OverviewScope) {
  const scope = useTenantSessionScope()
  return useQuery({
    queryKey: [...consoleKeys.overviewScope(overviewScope), scope.tenantId, ...scope.actorKey],
    enabled: scope.enabled,
    queryFn: ({ signal }) => consoleService.getOverview(overviewScope, signal),
    staleTime: 0,
    refetchInterval: livePollingMs,
  })
}

export function useSettings() {
  const scope = useTenantSessionScope()
  return useQuery({
    queryKey: [...consoleKeys.settings, scope.tenantId, ...scope.actorKey],
    queryFn: ({ signal }) => consoleService.getSettings(signal),
    enabled: scope.enabled,
  })
}

export function useFaceCheckProperties() {
  const scope = useTenantSessionScope()
  return useQuery({
    queryKey: ['face_check', 'properties', scope.tenantId, ...scope.actorKey],
    queryFn: ({ signal }) => consoleService.listProperties(signal),
    enabled: scope.enabled,
  })
}
