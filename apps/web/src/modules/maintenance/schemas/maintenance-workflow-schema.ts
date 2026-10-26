import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

import type { MaintenanceWorkflowRequirements } from '../types/maintenance'

export function createMaintenanceWorkflowSchema(
  t: SchemaMessageTranslator,
  required: MaintenanceWorkflowRequirements,
) {
  const text = (isRequired: boolean, max: number) =>
    isRequired ? z.string().trim().min(1, t('required')).max(max) : z.string().trim().max(max)

  return z.object({
    reason: text(required.reason, 5000),
    responsibleId: text(required.responsible, 200),
    contractId: text(required.contract, 200),
    status: z.enum(['ABERTO', 'EM_ANDAMENTO']),
    providerName: text(required.provider, 200),
    providerPhone: text(false, 50),
    providerEmail: z.union([z.literal(''), z.string().trim().email(t('emailInvalid'))]),
    providerNotes: text(false, 5000),
  })
}
