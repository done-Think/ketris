import { isAxiosError, isCancel } from 'axios'

import { httpClient } from '@shared/lib/api/http-client'
import type { DashboardFaceCheckNotificationCount } from '@shared/types/dashboard-face-check-notifications'

export class DashboardFaceCheckNotificationError extends Error {
  constructor(readonly status: number) {
    super('Unable to load verification notifications')
    this.name = 'DashboardFaceCheckNotificationError'
  }
}

export function isDashboardFaceCheckAccessDenied(error: unknown): boolean {
  return (
    error instanceof DashboardFaceCheckNotificationError && [401, 403, 404].includes(error.status)
  )
}

export const dashboardFaceCheckNotificationsService = {
  async count(signal: AbortSignal, accessToken: string) {
    try {
      return await httpClient.get<DashboardFaceCheckNotificationCount>(
        '/face_check/my-verifications/count',
        {
          signal,
          headers: { Authorization: `Bearer ${accessToken}` },
          skipUnauthorizedHandling: true,
        },
      )
    } catch (error) {
      if (isCancel(error)) throw error
      throw new DashboardFaceCheckNotificationError(
        isAxiosError(error) ? (error.response?.status ?? 0) : 0,
      )
    }
  },
}
