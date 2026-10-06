import { Controller } from 'react-hook-form'
import { Box, TextField } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'

import type {
  CreatePropertyValuesStepFieldsProps,
  PropertyValueFieldConfig,
} from '../types/dashboard-property'

function formatCurrencyInput(value: unknown, locale: string) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue) || numericValue <= 0) return ''

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(numericValue)
}

function parseCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, '')

  return digits ? Number(digits) : 0
}

export function CreatePropertyValuesStepFields({
  control,
  hasDualPurpose,
  mainValueLabel,
  negotiationTermLabel,
}: CreatePropertyValuesStepFieldsProps) {
  const t = useTranslations('properties.create')
  const locale = useLocale()
  const fields: PropertyValueFieldConfig[] = [
    ['mainValue', hasDualPurpose ? 'referenceValue' : mainValueLabel, true],
    ...(hasDualPurpose ? ([['rentalValue', 'rentValue', true]] as const) : []),
    ['condominium', 'condominium', true],
    ['iptu', 'iptu', true],
    ['negotiationTerm', negotiationTermLabel, false],
  ]

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        gap: 2,
      }}
    >
      {fields.map(([name, label, isCurrency]) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field, fieldState }) => (
            <TextField
              name={field.name}
              onBlur={field.onBlur}
              inputRef={field.ref}
              label={t(`fields.${label}`)}
              value={isCurrency ? formatCurrencyInput(field.value, locale) : field.value}
              onChange={(event) =>
                field.onChange(
                  isCurrency ? parseCurrencyInput(event.target.value) : event.target.value,
                )
              }
              slotProps={{
                htmlInput: isCurrency
                  ? {
                      inputMode: 'numeric',
                    }
                  : undefined,
              }}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
      ))}
    </Box>
  )
}
