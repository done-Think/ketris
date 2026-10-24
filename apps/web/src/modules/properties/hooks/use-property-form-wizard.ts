'use client'

import { useEffect, useState } from 'react'

import { createPropertySteps, propertyFormStepFields } from '../config/dashboard-property-ui'
import type {
  PropertyFormWizardOptions,
  PropertyFormWizardState,
  PropertyFormErrors,
} from '../types/dashboard-property'

export function usePropertyFormWizard({
  trigger,
  initialMaxVisitedStepIndex = 0,
  isUploading = false,
}: PropertyFormWizardOptions) {
  const [state, setState] = useState<PropertyFormWizardState>({
    activeStepIndex: 0,
    maxVisitedStepIndex: initialMaxVisitedStepIndex,
  })
  const { activeStepIndex, maxVisitedStepIndex } = state
  const activeStep = createPropertySteps[activeStepIndex]

  useEffect(() => {
    if (window.matchMedia('(max-width: 899px)').matches)
      window.scrollTo({ top: 0, behavior: 'auto' })
  }, [activeStepIndex])

  const selectStep = async (stepIndex: number) => {
    const target = Math.max(0, Math.min(stepIndex, createPropertySteps.length - 1))
    if (isUploading && target > activeStepIndex) return
    for (let index = activeStepIndex; index < target; index += 1) {
      const fields = propertyFormStepFields[createPropertySteps[index].key]
      if (!(await trigger(fields, { shouldFocus: true }))) {
        setState((current) => ({ ...current, activeStepIndex: index }))
        return
      }
    }
    setState((current) => ({
      activeStepIndex: target,
      maxVisitedStepIndex: Math.max(current.maxVisitedStepIndex, target),
    }))
  }

  const showErrors = (errors: PropertyFormErrors) => {
    const index = createPropertySteps.findIndex(({ key }) =>
      propertyFormStepFields[key].some((field) => Boolean(errors[field])),
    )
    if (index >= 0)
      setState((current) => ({
        activeStepIndex: index,
        maxVisitedStepIndex: Math.max(current.maxVisitedStepIndex, index),
      }))
  }

  return {
    activeStepIndex,
    maxVisitedStepIndex,
    activeStep,
    firstStep: activeStepIndex === 0,
    lastStep: activeStepIndex === createPropertySteps.length - 1,
    selectStep,
    showErrors,
    goToPreviousStep: () => selectStep(activeStepIndex - 1),
    goToNextStep: () => selectStep(activeStepIndex + 1),
  }
}
