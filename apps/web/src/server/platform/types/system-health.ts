export interface DatabaseHealth {
  status: 'up' | 'down'
  latencyMs: number | null
}

export interface ErrorTrackingIssue {
  id: string
  title: string
  level: string
  eventsCount: number
  lastSeen: Date
  permalink: string
}

export type ErrorTrackingHealth =
  | { configured: false }
  | { configured: true; available: false }
  | { configured: true; available: true; issues: ErrorTrackingIssue[] }

export interface SystemHealth {
  checkedAt: Date
  database: DatabaseHealth
  serverUptimeSeconds: number
  errorTracking: ErrorTrackingHealth
}
