export type DashboardNotificationKind = 'todayVisit' | 'assignedEvent'

export type DashboardNotificationHref = {
  pathname: '/dashboard/agenda' | '/dashboard/finance' | '/dashboard/leads' | '/dashboard/proposals'
  query?: {
    dueId?: string
    entryId?: string
    eventId?: string
    leadId?: string
    proposalId?: string
  }
}

export type DashboardNotificationItem = {
  href?: DashboardNotificationHref
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
