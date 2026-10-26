import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import * as crmStyles from '../../styles/create-lead-review-step.styles'

import { RhfTextField } from '@shared/components/form'

import type { CreateLeadFieldName, CreateLeadReviewStepProps } from '../../types/lead'

const reviewFieldKeys: readonly CreateLeadFieldName[] = [
  'name',
  'phone',
  'interest',
  'budget',
  'source',
]

export function CreateLeadReviewStep({ control, formValues }: CreateLeadReviewStepProps) {
  const t = useTranslations('crm.leads')

  return (
    <Stack spacing={1.6}>
      <Box sx={crmStyles.boxSx}>
        {reviewFieldKeys.map((fieldKey) => (
          <Box key={fieldKey} sx={crmStyles.boxSx2}>
            <Typography sx={crmStyles.typographySx}>{t(`create.fields.${fieldKey}`)}</Typography>
            <Typography sx={crmStyles.typographySx2}>{formValues[fieldKey]}</Typography>
          </Box>
        ))}
      </Box>

      <RhfTextField
        control={control}
        name="notes"
        label={t('create.fields.notes')}
        multiline
        minRows={3}
        fullWidth
      />
    </Stack>
  )
}
