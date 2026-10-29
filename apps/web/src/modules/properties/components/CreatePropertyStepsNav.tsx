import { styles } from '../styles/create-property-steps-nav.styles'
import { useTranslations } from 'next-intl'

import { WizardStepsNav } from '@shared/components/ui'

import { createPropertySteps } from '../config/dashboard-property-ui'
import type { CreatePropertyStepsNavProps } from '../types/dashboard-property'

export function CreatePropertyStepsNav({
  activeStepIndex,
  maxVisitedStepIndex,
  onStepSelect,
}: CreatePropertyStepsNavProps) {
  const t = useTranslations('properties.create.steps')

  return (
    <WizardStepsNav
      steps={createPropertySteps}
      activeStepIndex={activeStepIndex}
      reachableUpToIndex={maxVisitedStepIndex}
      completedUpToIndex={maxVisitedStepIndex - 1}
      ariaLabel={t('ariaLabel')}
      getStepLabel={(step) => t(step.key)}
      onStepSelect={onStepSelect}
      gridTemplateColumns={{ xs: '1fr', md: 'repeat(6, minmax(0, 1fr))' }}
      mobileProgressLabel={(current, total) => t('progress', { current, total })}
      sx={styles.wizardStepsNav}
    />
  )
}
