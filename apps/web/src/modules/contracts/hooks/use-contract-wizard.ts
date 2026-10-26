import { useListState } from '@shared/hooks/use-list-state'
import { createContractSteps } from '../config/contract-ui'

export function useContractWizard() {
  const { filters: state, setFilter } = useListState({ activeStepIndex: 0, maxStepIndex: 0 })
  return {
    ...state,
    previous: () => setFilter('activeStepIndex', Math.max(state.activeStepIndex - 1, 0)),
    next: () => {
      const next = Math.min(state.activeStepIndex + 1, createContractSteps.length - 1)
      setFilter('activeStepIndex', next)
      setFilter('maxStepIndex', Math.max(state.maxStepIndex, next))
    },
    select: (step: number) => {
      if (step >= 0 && step <= state.maxStepIndex) setFilter('activeStepIndex', step)
    },
  }
}
