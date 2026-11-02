import { useQuery } from '@tanstack/react-query'
import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'
import { candidateService } from '../services/candidate-service'
import { hasLostFaceCheckAccess } from '../utils/query-access'

export function useCandidateVerifications() {
  const scope = useTenantSessionScope()
  return useQuery({
    queryKey: ['face_check', 'candidate', scope.tenantId, ...scope.actorKey],
    enabled: scope.enabled && !scope.session?.authUnavailable && !!scope.session?.accessToken,
    queryFn: ({ signal }) => candidateService.list(signal, scope.session?.accessToken),
    staleTime: 0,
    retry: (attempt, error) => attempt < 1 && !hasLostFaceCheckAccess(error),
    refetchInterval: (query) => (hasLostFaceCheckAccess(query.state.error) ? false : 5000),
  })
}
