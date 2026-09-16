export type MaintenancePriority = 'urgent' | 'high' | 'normal'

export type MaintenanceCreateTicketFormValues = {
  propertyId: string
  category: string
  priority: MaintenancePriority
  title: string
  description: string
  estimatedCost?: string
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
}

export interface MaintenanceMetric {
  label: 'open' | 'urgent' | 'averageResolution'
  value: string
}

export interface MaintenanceFilter {
  value: 'all' | MaintenanceStatus | 'urgent'
  count: number
}
