import type { PlatformAlert } from '../types/platform-overview'

export const platformAlerts: readonly PlatformAlert[] = [
  { id: 'backup', elapsedMinutes: 2, tone: 'error' },
  { id: 'cpu', elapsedMinutes: 15, tone: 'warning' },
  { id: 'ssl', elapsedMinutes: 60, tone: 'info' },
  { id: 'tenant-registration', elapsedMinutes: 180, tone: 'info' },
]

export const platformLiveUtcDisplay = '2026-03-01 19:35'
