import type {
  MaintenanceMutation,
  MaintenanceRequestMutation,
  NewMaintenanceActivity,
} from './maintenance-ticket'

export interface MaintenanceActionPlan {
  changes: MaintenanceMutation
  activity: NewMaintenanceActivity
  request?: MaintenanceRequestMutation
}
