import type { components } from '@shared/types/generated/api'
export type ApiErrorTrackingIssue = Extract<
  components['schemas']['SystemHealthResponse']['errorTracking'],
  { configured: true; available: true }
>['issues'][number]

export type ApiErrorTrackingHealth = components['schemas']['SystemHealthResponse']['errorTracking']

export type ApiSystemHealth = components['schemas']['SystemHealthResponse']
