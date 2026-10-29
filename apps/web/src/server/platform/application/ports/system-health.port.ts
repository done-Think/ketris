import type { DatabaseHealth, ErrorTrackingHealth } from '../../types/system-health'

export interface DatabaseHealthProbe {
  check(): Promise<DatabaseHealth>
}

export interface ErrorTrackingProvider {
  getRecentIssues(): Promise<ErrorTrackingHealth>
}
