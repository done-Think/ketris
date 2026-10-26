import type { SchemaMessageTranslator } from '@shared/types'
import { z } from 'zod'
import type { MaintenanceWorkflowSelection } from '../types/maintenance'
import type { MaintenanceProviderOption } from '../types/maintenance-provider'

export function createMaintenanceWorkflowSchema(
  action: MaintenanceWorkflowSelection['action'],
  role: string | undefined,
  t: SchemaMessageTranslator,
) {
  return z
    .object({
      reason: z.string().trim(),
      catalogProvider: z
        .custom<MaintenanceProviderOption>((value) =>
          Boolean(
            value &&
            typeof value === 'object' &&
            'id' in value &&
            typeof value.id === 'string' &&
            value.id,
          ),
        )
        .nullable(),
      responsibleId: z.string(),
      contractId: z.string(),
      status: z.enum(['ABERTO', 'EM_ANDAMENTO']),
      name: z.string().trim(),
      phone: z.string().trim(),
      email: z.string().trim(),
      notes: z.string().trim(),
    })
    .superRefine((values, context) => {
      const require = (field: keyof typeof values) => {
        if (!values[field])
          context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: t('required') })
      }
      if ((action === 'provider' || action === 'approveReplacement') && !values.catalogProvider) {
        for (const [field, max, key] of [
          ['name', 200, 'nameTooLong'],
          ['phone', 50, 'phoneTooLong'],
          ['email', 254, 'emailTooLong'],
          ['notes', 5000, 'notesTooLong'],
        ] as const) {
          if (values[field].length > max)
            context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: t(key) })
        }
        require('name')
        if (values.email && !z.string().email().safeParse(values.email).success)
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['email'],
            message: t('emailInvalid'),
          })
      }
      if (
        ['contest', 'requestReplacement', 'rejectReplacement'].includes(action) ||
        (action === 'reopen' && role === 'RENTER')
      )
        require('reason')
      if (
        values.reason.length > 5000 &&
        (['contest', 'requestReplacement', 'rejectReplacement'].includes(action) ||
          (action === 'reopen' && role === 'RENTER'))
      )
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['reason'],
          message: t('reasonTooLong'),
        })
      if (action === 'assign') require('responsibleId')
      if (action === 'linkContract') require('contractId')
    })
}
