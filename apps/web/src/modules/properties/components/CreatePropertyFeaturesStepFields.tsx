import { styles } from '../styles/create-property-features-step-fields.styles'
import { Controller } from 'react-hook-form'
import { Box, Checkbox, FormControlLabel } from '@mui/material'
import { useTranslations } from 'next-intl'

import { RhfMaskedTextField } from '@shared/components/form'
import type { NumberInputMask } from '@shared/types'
import { createPropertyFeatureOptions } from '../config/dashboard-property-ui'
import type { CreatePropertyFeaturesStepFieldsProps } from '../types/dashboard-property'

// Text inputs that only accept numbers; type="number" would show the spin arrows.
const wholeNumber: NumberInputMask = { mask: Number, scale: 0, min: 0 }
const areaNumber: NumberInputMask = { mask: Number, scale: 2, min: 0 }

export function CreatePropertyFeaturesStepFields({
  control,
}: CreatePropertyFeaturesStepFieldsProps) {
  const t = useTranslations('properties.create')

  return (
    <Box sx={styles.box}>
      {(
        [
          ['bedrooms', wholeNumber],
          ['bathrooms', wholeNumber],
          ['parkingSpaces', wholeNumber],
          ['area', areaNumber],
        ] as const
      ).map(([name, mask]) => (
        <RhfMaskedTextField
          key={name}
          control={control}
          name={name}
          label={t(`fields.${name}`)}
          mask={mask}
          inputMode={mask.scale ? 'decimal' : 'numeric'}
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
                sx={styles.formControlLabel}
              />
            )
          }}
        />
      ))}
    </Box>
  )
}
