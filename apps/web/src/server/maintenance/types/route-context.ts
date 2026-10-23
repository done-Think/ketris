export interface MaintenanceTicketRouteContext {
  params: Promise<{ id: string }>
}

export interface MaintenanceMediaRouteContext {
  params: Promise<{ key: string[] }>
}
