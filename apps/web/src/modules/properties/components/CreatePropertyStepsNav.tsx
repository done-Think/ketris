import { useTranslations } from 'next-intl'

import { WizardStepsNav } from '@shared/components/ui'

import { createPropertySteps } from '../config/dashboard-property-ui'
import type { CreatePropertyStepsNavProps } from '../types/dashboard-property'

export function CreatePropertyStepsNav({
  activeStepIndex,
  onStepSelect,
}: CreatePropertyStepsNavProps) {
  const t = useTranslations('properties.create.steps')

  return (
    <WizardStepsNav
      steps={createPropertySteps}
      activeStepIndex={activeStepIndex}
      ariaLabel={t('ariaLabel')}
      getStepLabel={(step) => t(step.key)}
      onStepSelect={onStepSelect}
      gridTemplateColumns={{ xs: '1fr', md: 'repeat(6, minmax(0, 1fr))' }}
      sx={{ columnGap: { xs: 1, md: 0 }, rowGap: { xs: 1, md: 0 }, mb: 3 }}
    />
  )
}
