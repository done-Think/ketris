export interface ApiErrorTrackingIssue {
  id: string
  title: string
  level: string
  eventsCount: number
  lastSeen: string
  permalink: string
}

export type ApiErrorTrackingHealth =
  | { configured: false }
  | { configured: true; available: false }
  | { configured: true; available: true; issues: ApiErrorTrackingIssue[] }

export interface ApiSystemHealth {
  checkedAt: string
  database: { status: 'up' | 'down'; latencyMs: number | null }
  serverUptimeSeconds: number
  errorTracking: ApiErrorTrackingHealth
}
