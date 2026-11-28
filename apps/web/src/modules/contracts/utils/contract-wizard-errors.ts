import type { FieldErrors } from 'react-hook-form'

import { stepValidationFields } from '../config/contract-fields'
import type { CreateContractFormValues } from '../types/contract'

export function firstStepWithErrors(errors: FieldErrors<CreateContractFormValues>): number | null {
  const step = Object.entries(stepValidationFields).find(([, fields]) =>
    fields.some((field) => errors[field]),
  )
  return step ? Number(step[0]) : null
}
