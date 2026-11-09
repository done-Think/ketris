'use client'

import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'
import type { CandidateCapturePageProps } from '../../types/candidate.types'
import { CapturePage } from '../capture/CapturePage'

export function CandidateCapturePage({ token, userId, tenantId }: CandidateCapturePageProps) {
  const scope = useTenantSessionScope()
  if (scope.userId !== userId || scope.tenantId !== tenantId) return null
  return <CapturePage key={`${tenantId}:${userId}:${token}`} token={token} variant="dashboard" />
}
