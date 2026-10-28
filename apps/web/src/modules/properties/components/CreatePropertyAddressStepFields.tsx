import { styles, getAddressFieldStyles } from '../styles/create-property-address-step-fields.styles'
import { useId } from 'react'
import { Controller } from 'react-hook-form'
import { Box, FormHelperText, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { CreatePropertyAddressStepFieldsProps } from '../types/dashboard-property'
import { usePropertyPostalCode } from '../hooks/use-property-postal-code'
import { MaskedInput } from '@shared/components/form/MaskedInput'

export function CreatePropertyAddressStepFields({
  control,
  onAddressChange,
  getValues,
  setValue,
}: CreatePropertyAddressStepFieldsProps) {
  const t = useTranslations('properties.create')
  const postalCode = usePropertyPostalCode(getValues, setValue, onAddressChange)
  const coordinatesHintId = useId()

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
          render={({ field: { ref, ...field }, fieldState }) => (
            <TextField
              {...field}
              inputRef={ref}
              value={
                name === 'zipCode' ? String(field.value ?? '').replace(/\D/g, '') : field.value
              }
              onChange={(event) => {
                if (name === 'zipCode') {
                  const digits = event.target.value.replace(/\D/g, '')
                  if (digits === String(field.value ?? '').replace(/\D/g, '')) return
                  postalCode.cancel()
                  field.onChange(digits)
                } else field.onChange(event)
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
              slotProps={
                name === 'zipCode'
                  ? {
                      input: { inputComponent: MaskedInput as never },
                      htmlInput: {
                        mask: '00000-000',
                        unmask: true,
                        prepare: (value: string) => value.replace(/\D/g, ''),
                        inputMode: 'numeric',
                        autoComplete: 'postal-code',
                      },
                    }
                  : undefined
              }
            />
          )}
        />
      ))}
      <Box sx={styles.coordinates}>
        {(['latitude', 'longitude'] as const).map((name) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                id={`${coordinatesHintId}-${name}`}
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value)}
                type="number"
                label={t(`fields.${name}`)}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                slotProps={{
                  htmlInput: {
                    step: 'any',
                    'aria-describedby': fieldState.error
                      ? `${coordinatesHintId} ${coordinatesHintId}-${name}-helper-text`
                      : coordinatesHintId,
                  },
                }}
              />
            )}
          />
        ))}
        <FormHelperText id={coordinatesHintId} sx={styles.coordinatesHint}>
          {t('coordinatesHint')}
        </FormHelperText>
      </Box>
    </Box>
  )
}
