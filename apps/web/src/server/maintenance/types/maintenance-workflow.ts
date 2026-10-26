import type {
  MaintenanceAction,
  MaintenanceMutation,
  MaintenanceRequestMutation,
  NewMaintenanceActivity,
} from './maintenance-ticket'

// Actions decided only from the ticket and the actor (no lookups), handled by the domain.
export type PlannableMaintenanceAction = Exclude<
  MaintenanceAction,
  { action: 'linkContract' } | { action: 'assume' } | { action: 'assign' }
>

export interface MaintenanceTicketPlan {
  changes: MaintenanceMutation
  activity: NewMaintenanceActivity
  request?: MaintenanceRequestMutation
}
