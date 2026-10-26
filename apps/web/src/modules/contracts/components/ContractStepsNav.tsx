import { contractWizardColumns } from '../styles/contract-steps-nav.styles'
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
      gridTemplateColumns={contractWizardColumns}
    />
  )
}
