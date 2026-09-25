export type PlatformHealthStatus = 'healthy' | 'stable' | 'limited' | 'processing'
export type ClusterLogLevel = 'INFO' | 'WARN' | 'ERROR'

export interface PlatformHealthMetric {
  id: 'gateway' | 'database' | 'storage' | 'queue'
  value: number
  format: 'percent' | 'milliseconds' | 'number'
  status: PlatformHealthStatus
  tone: 'success' | 'warning'
}

export interface NetworkTrafficPoint extends Record<string, string | number> {
  time: string
  requests: number
}
export interface ErrorNotificationPoint extends Record<string, string | number> {
  time: string
  count: number
}
export interface ClusterLogEntry {
  time: string
  level: ClusterLogLevel
  service: string
  message: 'authentication' | 'rateLimit' | 'payment' | 'import' | 'backup' | 'connection'
}
