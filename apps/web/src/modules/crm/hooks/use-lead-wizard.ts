import { useListState } from '@shared/hooks/use-list-state'
import { createLeadSteps } from '../config/lead-creation'

export function useLeadWizard() {
  const { filters: state, setFilter } = useListState({ activeStepIndex: 0, maxVisitedStepIndex: 0 })
  return {
    ...state,
    previous: () => setFilter('activeStepIndex', Math.max(0, state.activeStepIndex - 1)),
    visit: (index: number) => {
      const step = Math.min(createLeadSteps.length - 1, Math.max(0, index))
      setFilter('activeStepIndex', step)
      setFilter('maxVisitedStepIndex', Math.max(state.maxVisitedStepIndex, step))
    },
  }
}
