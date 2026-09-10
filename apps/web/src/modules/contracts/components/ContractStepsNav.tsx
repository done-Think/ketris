import { useTranslations } from 'next-intl'

import { WizardStepsNav } from '@shared/components/ui'

import { createContractSteps } from '../config/contract-ui'
import type { ContractStepsNavProps } from '../types/contract'

export function ContractStepsNav({
  activeStepIndex,
  maxStepIndex,
  onStepSelect,
}: ContractStepsNavProps) {
  const t = useTranslations('contracts.wizard')

  return (
    <WizardStepsNav
      steps={createContractSteps}
      activeStepIndex={activeStepIndex}
      reachableUpToIndex={maxStepIndex}
      ariaLabel={t('stepsAriaLabel')}
      getStepLabel={(step) => t(`steps.${step.key}`)}
      onStepSelect={onStepSelect}
      fillActiveStep
      gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, 1fr)' }}
    />
  )
}
