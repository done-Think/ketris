import { Controller } from 'react-hook-form'
import { Box, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { CreatePropertyAddressStepFieldsProps } from '../types/dashboard-property'

export function CreatePropertyAddressStepFields({ control }: CreatePropertyAddressStepFieldsProps) {
  const t = useTranslations('properties.create')

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: '2fr 1fr' },
        gap: { xs: 1.2, md: 2 },
      }}
    >
      {[
        ['street', 'street'],
        ['number', 'number'],
        ['neighborhood', 'neighborhood'],
        ['city', 'city'],
        ['state', 'state'],
        ['zipCode', 'zipCode'],
      ].map(([name, label]) => (
        <Controller
          key={name}
          control={control}
          name={name as 'street' | 'number' | 'neighborhood' | 'city' | 'state' | 'zipCode'}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label={t(`fields.${label}`)}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              sx={{
                gridColumn: {
                  xs: name === 'street' || name === 'zipCode' ? '1 / -1' : 'auto',
                },
              }}
            />
          )}
        />
      ))}
    </Box>
  )
}
