export type DashboardNotificationKind = 'todayVisit' | 'assignedEvent' | 'faceCheckVerification'

export type DashboardNotificationHref = {
  pathname:
    | '/dashboard/agenda'
    | '/dashboard/finance'
    | '/dashboard/leads'
    | '/dashboard/proposals'
    | '/dashboard/face_check/my-verifications'
  query?: {
    dueId?: string
    entryId?: string
    eventId?: string
    leadId?: string
    proposalId?: string
    start?: 'next'
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
  placement?: 'pageHeader' | 'navigationHeader'
  notifications?: DashboardNotificationItem[]
  onNotificationSelect?: (notification: DashboardNotificationItem) => void
}
