import { ConflictError } from '@server/shared/errors'
import type {
  MaintenanceActor,
  MaintenanceProvider,
  NewMaintenanceActivity,
} from '../types/maintenance-ticket'

export function activity(
  actor: MaintenanceActor,
  type: NewMaintenanceActivity['type'],
  message: string,
  details?: Record<string, unknown>,
  systemAction?: string,
): NewMaintenanceActivity {
  return {
    ...(systemAction ? { systemAction } : {}),
    type,
    message,
    details,
    authorId: actor.actorId,
    authorName: actor.actorName,
    authorRole: actor.actorRole,
  }
}

export function reason(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) throw new ConflictError('Informe uma justificativa.')
  return trimmed
}

export function provider(value: MaintenanceProvider): MaintenanceProvider {
  if (!value.name.trim() && !value.id) throw new ConflictError('Informe o nome do prestador.')
  return {
    ...(value.id ? { id: value.id } : {}),
    name: value.name.trim(),
    phone: value.phone?.trim() || null,
    email: value.email?.trim() || null,
    notes: value.notes?.trim() || null,
  }
}
