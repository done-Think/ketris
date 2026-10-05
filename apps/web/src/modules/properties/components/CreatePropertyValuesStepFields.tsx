import { Controller } from 'react-hook-form'
import { Box, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { CreatePropertyValuesStepFieldsProps } from '../types/dashboard-property'

export function CreatePropertyValuesStepFields({
  control,
  hasDualPurpose,
  mainValueLabel,
  negotiationTermLabel,
}: CreatePropertyValuesStepFieldsProps) {
  const t = useTranslations('properties.create')

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        gap: 2,
      }}
    >
      {[
        ['mainValue', hasDualPurpose ? 'referenceValue' : mainValueLabel, 'number'],
        ...(hasDualPurpose ? ([['rentalValue', 'rentValue', 'number']] as const) : []),
        ['condominium', 'condominium', 'number'],
        ['iptu', 'iptu', 'number'],
        ['negotiationTerm', negotiationTermLabel, 'text'],
      ].map(([name, label, type]) => (
        <Controller
          key={name}
          control={control}
          name={name as 'mainValue' | 'rentalValue' | 'condominium' | 'iptu' | 'negotiationTerm'}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label={t(`fields.${label}`)}
              type={type}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
      ))}
    </Box>
  )
}
