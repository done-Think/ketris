import { useQuery } from '@tanstack/react-query'
import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'

import type { OverviewScope, SessionListQuery } from '../types'
import { isCaptureInFlight } from '../utils/session-status'
import { hasLostFaceCheckAccess } from '../utils/query-access'

import { ApiError } from '../services/api-error'
import { consoleService } from '../services/console-service'
import { consoleKeys } from './console-query-keys'

const listPollingMs = 30_000
const livePollingMs = 3000

function shouldPauseAutomaticRequests(error: unknown) {
  return (
    hasLostFaceCheckAccess(error) ||
    (error instanceof ApiError && error.code === 'STORAGE_UNAVAILABLE')
  )
}

const consoleRequestOptions = {
  retry: (attempt: number, error: unknown) => attempt < 1 && !shouldPauseAutomaticRequests(error),
  retryDelay: 5000,
  retryOnMount: false,
}

export function useSessionList(query: SessionListQuery) {
  const scope = useTenantSessionScope()
  return useQuery({
    ...consoleRequestOptions,
    queryKey: [...consoleKeys.sessionList(query), scope.tenantId, ...scope.actorKey],
    enabled: scope.enabled,
    queryFn: ({ signal }) => consoleService.listSessions(query, signal),
    staleTime: listPollingMs,
    refetchInterval: (query) =>
      shouldPauseAutomaticRequests(query.state.error) ? false : listPollingMs,
  })
}

export function useSession(id: string) {
  const scope = useTenantSessionScope()
  return useQuery({
    ...consoleRequestOptions,
    queryKey: [...consoleKeys.session(id), scope.tenantId, ...scope.actorKey],
    enabled: scope.enabled,
    queryFn: ({ signal }) => consoleService.getSession(id, signal),
    staleTime: 0,
    refetchInterval: (query) =>
      shouldPauseAutomaticRequests(query.state.error)
        ? false
        : query.state.data && isCaptureInFlight(query.state.data.status)
          ? 1000
          : livePollingMs,
  })
}

export function useOverview(overviewScope: OverviewScope) {
  const scope = useTenantSessionScope()
  return useQuery({
    ...consoleRequestOptions,
    queryKey: [...consoleKeys.overviewScope(overviewScope), scope.tenantId, ...scope.actorKey],
    enabled: scope.enabled,
    queryFn: ({ signal }) => consoleService.getOverview(overviewScope, signal),
    staleTime: listPollingMs,
    refetchInterval: (query) =>
      shouldPauseAutomaticRequests(query.state.error) ? false : listPollingMs,
  })
}

export function useSettings() {
  const scope = useTenantSessionScope()
  return useQuery({
    ...consoleRequestOptions,
    queryKey: [...consoleKeys.settings, scope.tenantId, ...scope.actorKey],
    queryFn: ({ signal }) => consoleService.getSettings(signal),
    enabled: scope.enabled,
  })
}

export function useFaceCheckProperties() {
  const scope = useTenantSessionScope()
  return useQuery({
    ...consoleRequestOptions,
    queryKey: ['face_check', 'properties', scope.tenantId, ...scope.actorKey],
    queryFn: ({ signal }) => consoleService.listProperties(signal),
    enabled: scope.enabled,
  })
}
