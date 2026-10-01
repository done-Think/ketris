import { Controller } from 'react-hook-form'
import { Checkbox, FormControlLabel, Stack } from '@mui/material'
import { useTranslations } from 'next-intl'

import { radius } from '@shared/theme/tokens'

import { createPropertyPublishingOptions } from '../config/dashboard-property-ui'
import type { CreatePropertyPublishingStepFieldsProps } from '../types/dashboard-property'

export function CreatePropertyPublishingStepFields({
  control,
}: CreatePropertyPublishingStepFieldsProps) {
  const t = useTranslations('properties.create')

  return (
    <Stack spacing={1.6}>
      {createPropertyPublishingOptions.map((option) => (
        <Controller
          key={option}
          control={control}
          name="publishingOptions"
          render={({ field }) => {
            const checked = field.value.includes(option)

            return (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={checked}
                    size="small"
                    onChange={(event) => {
                      field.onChange(
                        event.target.checked
                          ? [...field.value, option]
                          : field.value.filter((item) => item !== option),
                      )
                    }}
                  />
                }
                label={t(`publishingOptions.${option}`)}
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
    </Stack>
  )
}
