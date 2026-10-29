import { Box, Stack } from '@mui/material'
import { ContractAmountField } from '../ContractAmountField'
import { useTranslations } from 'next-intl'
import type { ContractStepControlProps } from '../../types/contract'
import { FieldGrid, SectionTitle } from './shared'
import { toFieldConfig } from '../../utils/contract-fields'
import { conditionsStepFieldsMeta } from '../../config/contract-fields'

export function ConditionsStep({ control }: ContractStepControlProps) {
  const t = useTranslations('contracts.wizard.conditions')

  return (
    <Stack spacing={3}>
      <Box>
        <SectionTitle>{t('title')}</SectionTitle>
        <ContractAmountField control={control} />
        <FieldGrid
          control={control}
          fields={[
            ...conditionsStepFieldsMeta.map((field) => toFieldConfig(field, t, false, t)),
            toFieldConfig({ name: 'notes', labelKey: 'notes' }, t, true),
          ]}
        />
      </Box>
    </Stack>
  )
}
