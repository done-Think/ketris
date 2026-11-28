import { Box } from '@mui/material'
import { Controller } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import type {
  CreatePropertyValuesStepFieldsProps,
  PropertyValueFieldConfig,
} from '../types/dashboard-property'
import { styles } from '../styles/create-property-values-step-fields.styles'
import { PropertyMoneyField } from './PropertyMoneyField'
import { PropertyNegotiationConditionsField } from './PropertyNegotiationConditionsField'

export function CreatePropertyValuesStepFields({
  control,
  hasDualPurpose,
  mainValueLabel,
  propertyPurpose,
}: CreatePropertyValuesStepFieldsProps) {
  const t = useTranslations('properties.create')
  const fields: PropertyValueFieldConfig[] = [
    ['mainValue', hasDualPurpose ? 'referenceValue' : mainValueLabel, true],
    ...(hasDualPurpose ? ([['rentalValue', 'rentValue', true]] as const) : []),
    ['condominium', 'condominium', true],
    ['propertyTax', 'propertyTax', true],
  ]
  return (
    <Box sx={styles.box}>
      {fields.map(([name, label]) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field, fieldState }) => (
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
          )}
        />
      ))}
      <PropertyNegotiationConditionsField control={control} propertyPurpose={propertyPurpose} />
    </Box>
  )
}
