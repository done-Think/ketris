'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { styles } from '../../styles/agency-brand-editor.styles'
import type { AgencyBrandWizardStepProps } from '../../types/agency-brand-editor'
import { AgencyBrandColorFields } from './AgencyBrandColorFields'
import { AgencyBrandImageField } from './AgencyBrandImageField'
import { AgencyBrandReview } from './AgencyBrandReview'

export function AgencyBrandWizardStep({
  step,
  control,
  values,
  suggestion,
  onApplyPalette,
  onHighlight,
}: AgencyBrandWizardStepProps) {
  const t = useTranslations('marketplace.agencyProfileEditor.brand.wizard')

  return (
    <Box sx={styles.section}>
      <Typography component="h3" sx={styles.stepTitle}>
        {t(`titles.${step}`)}
      </Typography>
      <Typography sx={styles.colorHelp}>{t(`descriptions.${step}`)}</Typography>
      {step === 'logo' ? <AgencyBrandImageField control={control} name="logoUrl" /> : null}
      {step === 'colors' ? (
        <AgencyBrandColorFields
          control={control}
          values={values}
          suggestion={suggestion}
          onApplyPalette={onApplyPalette}
          onHighlight={onHighlight}
        />
      ) : null}
      {step === 'cover' ? <AgencyBrandImageField control={control} name="bannerUrl" /> : null}
      {step === 'review' ? <AgencyBrandReview values={values} /> : null}
    </Box>
  )
}
