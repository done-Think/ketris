import type { DatabaseHealth, ErrorTrackingHealth } from '../../domain/system-health.entity'

export interface DatabaseHealthProbe {
  check(): Promise<DatabaseHealth>
}

export interface ErrorTrackingProvider {
  getRecentIssues(): Promise<ErrorTrackingHealth>
}
