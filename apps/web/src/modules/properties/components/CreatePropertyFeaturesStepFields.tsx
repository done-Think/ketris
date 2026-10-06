import { Controller } from 'react-hook-form'
import { Box, Checkbox, FormControlLabel, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import { radius } from '@shared/theme/tokens'

import { createPropertyFeatureOptions } from '../config/dashboard-property-ui'
import type { CreatePropertyFeaturesStepFieldsProps } from '../types/dashboard-property'

export function CreatePropertyFeaturesStepFields({
  control,
}: CreatePropertyFeaturesStepFieldsProps) {
  const t = useTranslations('properties.create')

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(4, minmax(0, 1fr))',
        },
        gap: { xs: 1.2, md: 2 },
      }}
    >
      {[
        ['bedrooms', 'bedrooms', 'number'],
        ['bathrooms', 'bathrooms', 'number'],
        ['parkingSpaces', 'parkingSpaces', 'number'],
        ['area', 'area', 'number'],
      ].map(([name, label, type]) => (
        <Controller
          key={name}
          control={control}
          name={name as 'bedrooms' | 'bathrooms' | 'parkingSpaces' | 'area'}
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

      {createPropertyFeatureOptions.map((feature) => (
        <Controller
          key={feature}
          control={control}
          name="features"
          render={({ field }) => {
            const checked = field.value.includes(feature)

            return (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={checked}
                    size="small"
                    onChange={(event) => {
                      field.onChange(
                        event.target.checked
                          ? [...field.value, feature]
                          : field.value.filter((item) => item !== feature),
                      )
                    }}
                  />
                }
                label={t(`features.${feature}`)}
                sx={{
                  minHeight: 44,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: `${radius.sm}px`,
                  mx: 0,
                  px: 1,
                  '& .MuiFormControlLabel-label': { fontSize: 14, fontWeight: 800 },
                }}
              />
            )
          }}
        />
      ))}
    </Box>
  )
}
