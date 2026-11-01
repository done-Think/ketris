'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'

import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'
import {
  dashboardFaceCheckNotificationsService,
  isDashboardFaceCheckAccessDenied,
} from '@shared/services/dashboard-face-check-notifications-service'
import type { DashboardNotificationItem } from '@shared/types/dashboard-notification'

export function useDashboardFaceCheckNotifications(): DashboardNotificationItem[] {
  const scope = useTenantSessionScope()
  const t = useTranslations('dashboard.notificationsCenter')
  const token = scope.session?.accessToken
  const enabled =
    scope.enabled && scope.session?.scope === 'tenant' && !scope.session.authUnavailable && !!token
  const query = useQuery({
    queryKey: ['dashboard', 'face-check-notifications', scope.tenantId, ...scope.actorKey],
    queryFn: ({ signal }) => dashboardFaceCheckNotificationsService.count(signal, token ?? ''),
    enabled,
    gcTime: 0,
    staleTime: 0,
    retry: (attempt, error) => attempt < 1 && !isDashboardFaceCheckAccessDenied(error),
    refetchInterval: (state) =>
      isDashboardFaceCheckAccessDenied(state.state.error) ? false : 30000,
  })
  if (!enabled || isDashboardFaceCheckAccessDenied(query.error)) return []
  const pendingCount = Math.max(0, Math.floor(query.data?.pendingCount ?? 0))
  if (!pendingCount) return []
  return [
    {
      id: 'face-check-pending-verifications',
      kind: 'faceCheckVerification',
      title: t('faceCheckVerification.title', { count: pendingCount }),
      message: t('faceCheckVerification.message', { count: pendingCount }),
      href: { pathname: '/dashboard/face_check/my-verifications', query: { start: 'next' } },
    },
  ]
}
