import { styles, getAddressFieldStyles } from '../styles/create-property-address-step-fields.styles'
import { Controller } from 'react-hook-form'
import { Box, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { CreatePropertyAddressStepFieldsProps } from '../types/dashboard-property'
import { usePropertyPostalCode } from '../hooks/use-property-postal-code'

export function CreatePropertyAddressStepFields({
  control,
  onAddressChange,
  getValues,
  setValue,
}: CreatePropertyAddressStepFieldsProps) {
  const t = useTranslations('properties.create')
  const postalCode = usePropertyPostalCode(getValues, setValue, onAddressChange)

  return (
    <Box sx={styles.box}>
      {(
        [
          ['zipCode', 'zipCode'],
          ['street', 'street'],
          ['number', 'number'],
          ['complement', 'complement'],
          ['neighborhood', 'neighborhood'],
          ['city', 'city'],
          ['state', 'state'],
        ] as const
      ).map(([name, label]) => (
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
                if (name === 'zipCode') postalCode.cancel()
                field.onChange(event)
                onAddressChange()
              }}
              onBlur={() => {
                field.onBlur()
                if (name === 'zipCode') void postalCode.lookup()
              }}
              label={t(`fields.${label}`)}
              error={Boolean(fieldState.error)}
              helperText={
                fieldState.error?.message ??
                (name === 'zipCode' ? t(`postalCode.${postalCode.status}`) : undefined)
              }
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
              helperText={
                fieldState.error?.message ??
                (name === 'latitude' ? t('coordinatesHint') : undefined)
              }
              slotProps={{ htmlInput: { step: 'any' } }}
            />
          )}
        />
      ))}
    </Box>
  )
}
