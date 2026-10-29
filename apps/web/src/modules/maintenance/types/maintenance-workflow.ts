import type { Control } from 'react-hook-form'
import type { z } from 'zod'
import type { createMaintenanceWorkflowSchema } from '../schemas/maintenance-workflow-schema'
import type { MaintenanceWorkflowSelection } from './maintenance'
import type { ApiMaintenanceTicket } from './service'

export type MaintenanceWorkflowFormValues = z.infer<
  ReturnType<typeof createMaintenanceWorkflowSchema>
>

export interface MaintenanceWorkflowFormProps {
  ticket: ApiMaintenanceTicket
  selection: MaintenanceWorkflowSelection
  role?: string
  isPending: boolean
  onSubmit: (values: MaintenanceWorkflowFormValues) => Promise<void>
  onClose: () => void
}

export interface MaintenanceProviderPickerProps {
  control: Control<MaintenanceWorkflowFormValues>
  ticketId: string
}
