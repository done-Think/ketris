import type { ContractStepFieldsProps } from '../types/contract'
import { ConditionsStep, conditionsStepFieldNames } from './contract-step-fields/ConditionsStep'
import { OpportunityStep, opportunityStepFieldNames } from './contract-step-fields/OpportunityStep'
import { PartiesStep, partiesStepFieldNames } from './contract-step-fields/PartiesStep'
import { ReviewStep } from './contract-step-fields/ReviewStep'

export { conditionsStepFieldNames, opportunityStepFieldNames, partiesStepFieldNames }

export function ContractStepFields({
  activeStepKey,
  control,
  setValue,
  values,
}: ContractStepFieldsProps) {
  if (activeStepKey === 'opportunity') {
    return <OpportunityStep control={control} setValue={setValue} values={values} />
  }
  if (activeStepKey === 'conditions') return <ConditionsStep control={control} />
  if (activeStepKey === 'review') return <ReviewStep values={values} />

  return <PartiesStep control={control} setValue={setValue} values={values} />
}
