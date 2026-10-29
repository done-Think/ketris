import { PropertyMoneyField } from './PropertyMoneyField'
import { styles } from '../styles/create-property-values-step-fields.styles'
import { Controller } from 'react-hook-form'
import { Box, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import type {
  CreatePropertyValuesStepFieldsProps,
  PropertyValueFieldConfig,
} from '../types/dashboard-property'

export function CreatePropertyValuesStepFields({
  control,
  hasDualPurpose,
  mainValueLabel,
  negotiationTermLabel,
}: CreatePropertyValuesStepFieldsProps) {
  const t = useTranslations('properties.create')
  const fields: PropertyValueFieldConfig[] = [
    ['mainValue', hasDualPurpose ? 'referenceValue' : mainValueLabel, true],
    ...(hasDualPurpose ? ([['rentalValue', 'rentValue', true]] as const) : []),
    ['condominium', 'condominium', true],
    ['propertyTax', 'propertyTax', true],
    ['negotiationTerm', negotiationTermLabel, false],
  ]

  return (
    <Box sx={styles.box}>
      {fields.map(([name, label, isCurrency]) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field, fieldState }) =>
            isCurrency ? (
              <PropertyMoneyField
                name={field.name}
                onBlur={field.onBlur}
                inputRef={field.ref}
                label={t(`fields.${label}`)}
                value={Number(field.value ?? 0)}
                onValueChange={field.onChange}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            ) : (
              <TextField
                {...field}
                label={t(`fields.${label}`)}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )
          }
        />
      ))}
    </Box>
  )
}
