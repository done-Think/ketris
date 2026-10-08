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
  propertyId: string
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

export type MaintenanceStatusFiltersProps = {
  activeFilter: MaintenanceFilter['value']
  direction?: 'row' | 'column'
  getFilterCount: (value: MaintenanceFilter['value']) => number
  isDesktop?: boolean
  onChange: (value: MaintenanceFilter['value']) => void
}

export type MaintenanceFilterOptionLabelProps = {
  active: boolean
  count: number
  label: string
}

export type MetricCardProps = {
  label: string
  value: string
  tone: 'open' | 'urgent' | 'averageResolution'
}
