import { styles, getAddressFieldStyles } from '../styles/create-property-address-step-fields.styles'
import { Controller } from 'react-hook-form'
import { Box, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { CreatePropertyAddressStepFieldsProps } from '../types/dashboard-property'

export function CreatePropertyAddressStepFields({
  control,
  onAddressChange,
}: CreatePropertyAddressStepFieldsProps) {
  const t = useTranslations('properties.create')

  return (
    <Box sx={styles.box}>
      {[
        ['street', 'street'],
        ['number', 'number'],
        ['complement', 'complement'],
        ['neighborhood', 'neighborhood'],
        ['city', 'city'],
        ['state', 'state'],
        ['zipCode', 'zipCode'],
      ].map(([name, label]) => (
        <Controller
          key={name}
          control={control}
          name={
            name as
              'street' | 'number' | 'neighborhood' | 'city' | 'state' | 'zipCode' | 'complement'
          }
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              onChange={(event) => {
                field.onChange(event)
                onAddressChange()
              }}
              label={t(`fields.${label}`)}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              sx={getAddressFieldStyles(name)}
            />
          )}
        />
      ))}
      {(['latitude', 'longitude'] as const).map((name) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              onChange={(event) => field.onChange(event.target.value)}
              type="number"
              label={t(`fields.${name}`)}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              slotProps={{ htmlInput: { step: 'any' } }}
            />
          )}
        />
      ))}
    </Box>
  )
}
