import { Box, MenuItem } from '@mui/material'
import { useTranslations } from 'next-intl'
import * as crmStyles from '../../styles/create-lead-interest-step.styles'

import { RhfTextField } from '@shared/components/form'

import { leadSourceOptions } from '../../config/lead-creation'
import type { CreateLeadInterestStepProps } from '../../types/lead'
import { Controller } from 'react-hook-form'
import { PropertyAutocomplete } from '../opportunity-detail/PropertyAutocomplete'

export function CreateLeadInterestStep({ control }: CreateLeadInterestStepProps) {
  const t = useTranslations('crm.leads')

  return (
    <Box sx={crmStyles.boxSx}>
      <Controller
        control={control}
        name="property"
        render={({ field, fieldState }) => (
          <PropertyAutocomplete
            value={field.value}
            onChange={field.onChange}
            availableOnly
            label={t('create.fields.property')}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message ?? t('create.propertyHint')}
          />
        )}
      />
      <RhfTextField control={control} name="budget" label={t('create.fields.budget')} />
      <RhfTextField
        control={control}
        name="source"
        label={t('create.fields.source')}
        select
        sx={crmStyles.rhfTextFieldSx}
      >
        {leadSourceOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {t(`create.sources.${option.labelKey}`)}
          </MenuItem>
        ))}
      </RhfTextField>
    </Box>
  )
}
