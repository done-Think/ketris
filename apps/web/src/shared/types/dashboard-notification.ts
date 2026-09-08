export type DashboardNotificationKind = 'todayVisit' | 'assignedEvent'

export type DashboardNotificationItem = {
  id: string
  kind: DashboardNotificationKind
  message: string
  title: string
  metadata?: Record<string, string>
}

export type DashboardNotificationsButtonProps = {
  notifications?: DashboardNotificationItem[]
  onNotificationSelect?: (notification: DashboardNotificationItem) => void
}
