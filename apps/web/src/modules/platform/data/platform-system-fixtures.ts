import type {
  ClusterLogEntry,
  ErrorNotificationPoint,
  NetworkTrafficPoint,
  PlatformHealthMetric,
} from '../types/platform-system'

/** Demonstration-only snapshots; no remote monitoring. */
export const platformHealthMetrics: readonly PlatformHealthMetric[] = [
  { id: 'gateway', value: 0.999, format: 'percent', status: 'healthy', tone: 'success' },
  { id: 'database', value: 45, format: 'milliseconds', status: 'stable', tone: 'success' },
  { id: 'storage', value: 0.78, format: 'percent', status: 'limited', tone: 'warning' },
  { id: 'queue', value: 234, format: 'number', status: 'processing', tone: 'success' },
]

export const networkAverageRequestsPerMinute = 14_800

export const networkTraffic: readonly NetworkTrafficPoint[] = [
  ['00:00', 8],
  ['01:00', 9],
  ['02:00', 13],
  ['03:00', 17],
  ['04:00', 16],
  ['05:00', 14],
  ['06:00', 10],
  ['07:00', 12],
  ['08:00', 20],
  ['09:00', 25],
  ['10:00', 23],
  ['11:00', 19],
  ['12:00', 24],
  ['13:00', 29],
  ['14:00', 25],
  ['15:00', 18],
  ['16:00', 15],
  ['17:00', 13],
  ['18:00', 16],
  ['19:00', 22],
  ['20:00', 24],
  ['21:00', 20],
  ['22:00', 17],
].map(([time, requests]) => ({ time: String(time), requests: Number(requests) }))

export const errorNotifications: readonly ErrorNotificationPoint[] = [
  12, 18, 42, 25, 14, 8, 2, 5, 29, 34, 11, 4,
].map((count, index) => ({ time: `${String(index + 3).padStart(2, '0')}h`, count }))

export const clusterLogs: readonly ClusterLogEntry[] = [
  {
    time: '14:32:01',
    level: 'INFO',
    service: 'auth-service',
    message: 'authentication',
  },
  {
    time: '14:31:55',
    level: 'WARN',
    service: 'api-gateway',
    message: 'rateLimit',
  },
  {
    time: '14:31:48',
    level: 'ERROR',
    service: 'billing-worker',
    message: 'payment',
  },
  {
    time: '14:30:22',
    level: 'INFO',
    service: 'importer',
    message: 'import',
  },
  {
    time: '14:28:10',
    level: 'INFO',
    service: 'sync-service',
    message: 'backup',
  },
  {
    time: '14:27:01',
    level: 'ERROR',
    service: 'api-gateway',
    message: 'connection',
  },
]
