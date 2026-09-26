export type MaintenancePriority = 'urgent' | 'high' | 'normal'

export type MaintenanceCreateTicketFormValues = {
  propertyId: string
  category: string
  priority: MaintenancePriority
  title: string
  description: string
}

export type MaintenanceStatus = 'inProgress' | 'open' | 'resolved' | 'closed'

export interface MaintenanceTicket {
  id: string
  property: string
  category: string
  priority: MaintenancePriority
  tenant: string
  openedAt: string
  status: MaintenanceStatus
  title?: string
  description?: string
}

export interface MaintenanceMetric {
  label: 'open' | 'urgent' | 'averageResolution'
  value: string
}

export interface MaintenanceFilter {
  value: 'all' | MaintenanceStatus | 'urgent'
  count: number
}

export interface MaintenanceTimelineEntry {
  name: string
  role: string
  timestamp: string
  message: string
}

export interface MaintenanceResponsible {
  name: string
  role: string
  initials: string
}

export interface MaintenanceTicketDetail {
  code: string
  title: string
  description: string
  property: string
  category: string
  openedBy: string
  openedAt: string
  openedTime?: string
  lastUpdated: string
  estimatedSla: string
  status: MaintenanceStatus
  priority: MaintenancePriority
  responsibles: readonly MaintenanceResponsible[]
  timeline: readonly MaintenanceTimelineEntry[]
  photos: readonly {
    name: string
    src: string
    position: 'left' | 'right'
  }[]
}
