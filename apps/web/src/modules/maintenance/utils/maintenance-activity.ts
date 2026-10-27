import { maintenanceSystemActionKeys } from '@server/maintenance/constants/maintenance-system-actions'
import type { ApiMaintenanceActivity } from '../types/service'
import { maintenanceStatusFromApiMap } from './maintenance-adapter'

export function formatMaintenanceActivity(
  activity: ApiMaintenanceActivity,
  translate: (key: string, values?: Record<string, string>) => string,
): string {
  const code = activity.systemAction
  if (!code) return activity.message
  const key = maintenanceSystemActionKeys[code]
  if (!key) return activity.message
  const statusLabel = (value: unknown) => {
    if (typeof value !== 'string') return ''
    const status = Object.entries(maintenanceStatusFromApiMap).find(([code]) => code === value)?.[1]
    return status ? translate(`statuses.${status}`) : value
  }
  const message = translate(`activityMessages.${key}`, {
    before: statusLabel(activity.details?.before),
    after: statusLabel(activity.details?.after),
  })
  const hasReason =
    [
      'RESOLUTION_CONTESTED',
      'PROVIDER_REPLACEMENT_REQUESTED',
      'PROVIDER_REPLACEMENT_REJECTED',
    ].includes(code) ||
    (code === 'TICKET_REOPENED' && Boolean(activity.details?.reason))
  return (hasReason || code === 'ATTACHMENT_ADDED') && activity.message
    ? `${message}\n${activity.message}`
    : message
}
