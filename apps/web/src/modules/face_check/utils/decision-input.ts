import type { DecisionFormValues } from '../schemas/console.schemas'
import type { DecisionInput } from '../types'

export function buildDecisionInput(
  values: DecisionFormValues,
  manualOverrideAllowed: boolean,
  manualOverrideRequired = false,
): DecisionInput | null {
  if (!values.decision) return null
  if (values.decision === 'approve' && manualOverrideRequired && !values.manualOverride) return null
  if (
    values.manualOverride &&
    (values.decision !== 'approve' || !manualOverrideAllowed || !values.reviewedEvidence)
  )
    return null
  return {
    decision: values.decision,
    reason: values.reason,
    note: values.note,
    ...(values.decision === 'approve' && values.manualOverride ? { manualOverride: true } : {}),
  }
}
