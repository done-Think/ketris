import { Box, Stack } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { ContractStepControlProps } from '../../types/contract'
import { FieldGrid, SectionTitle, conditionsStepFieldsMeta, toFieldConfig } from './shared'

export const conditionsStepFieldNames = [
  ...conditionsStepFieldsMeta.map((field) => field.name),
  'notes' as const,
]

export function ConditionsStep({ control }: ContractStepControlProps) {
  const t = useTranslations('contracts.wizard.conditions')

  return (
    <Stack spacing={3}>
      <Box>
        <SectionTitle>{t('title')}</SectionTitle>
        <FieldGrid
          control={control}
          fields={[
            ...conditionsStepFieldsMeta.map((field) => toFieldConfig(field, t)),
            toFieldConfig({ name: 'notes', labelKey: 'notes' }, t, true),
          ]}
        />
      </Box>
    </Stack>
  )
}
