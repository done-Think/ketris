import type { ContractStepFieldsProps } from '../types/contract'
import { ConditionsStep } from './contract-step-fields/ConditionsStep'
import { OpportunityStep } from './contract-step-fields/OpportunityStep'
import { PartiesStep } from './contract-step-fields/PartiesStep'
import { ReviewStep } from './contract-step-fields/ReviewStep'

export function ContractStepFields({ activeStepKey, control, setValue }: ContractStepFieldsProps) {
  if (activeStepKey === 'opportunity') {
    return <OpportunityStep control={control} setValue={setValue} />
  }
  if (activeStepKey === 'conditions') return <ConditionsStep control={control} />
  if (activeStepKey === 'review') return <ReviewStep control={control} />

  return <PartiesStep control={control} setValue={setValue} />
}
