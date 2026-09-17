export type PlatformHealthStatus = 'healthy' | 'stable' | 'limited' | 'processing'
export type ClusterLogLevel = 'INFO' | 'WARN' | 'ERROR'

export interface PlatformHealthMetric {
  id: 'gateway' | 'database' | 'storage' | 'queue'
  value: string
  status: PlatformHealthStatus
  tone: 'success' | 'warning'
}

export interface NetworkTrafficPoint {
  time: string
  requests: number
}
export interface ErrorNotificationPoint {
  time: string
  count: number
}
export interface ClusterLogEntry {
  time: string
  level: ClusterLogLevel
  service: string
  message: string
}
