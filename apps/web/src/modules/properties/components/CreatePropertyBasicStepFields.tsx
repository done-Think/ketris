import { PropertyOwnerSelect } from './PropertyOwnerSelect'
import { PropertyOwnerAccessSelect } from './PropertyOwnerAccessSelect'
import { styles, getPurposeOptionStyles } from '../styles/create-property-basic-step-fields.styles'
import { Controller } from 'react-hook-form'
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { useTranslations } from 'next-intl'

import {
  createPropertyPurposeOptions,
  createPropertyTypeOptions,
} from '../config/dashboard-property-ui'
import type { CreatePropertyBasicStepFieldsProps } from '../types/dashboard-property'

export function CreatePropertyBasicStepFields({ control }: CreatePropertyBasicStepFieldsProps) {
  const t = useTranslations('properties.create')

  return (
    <>
      <Box sx={styles.box}>
        <FormControl fullWidth>
          <Typography sx={styles.typography}>{t('fields.propertyType')}</Typography>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select {...field} IconComponent={KeyboardArrowDownRoundedIcon} sx={styles.select}>
                {createPropertyTypeOptions.map((type) => (
                  <MenuItem key={type} value={type}>
                    {t(`propertyTypes.${type}`)}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        </FormControl>

        <Box>
          <Box sx={styles.box2}>
            <Typography sx={styles.typography2}>{t('fields.purpose')}</Typography>
            <Controller
              control={control}
              name="purpose"
              render={({ field }) => (
                <Box sx={styles.box3}>
                  {createPropertyPurposeOptions.map((purpose) => {
                    const active = field.value.includes(purpose)

                    return (
                      <FormControlLabel
                        key={purpose}
                        control={
                          <Checkbox
                            checked={active}
                            size="small"
                            onChange={(event) => {
                              field.onChange(
                                event.target.checked
                                  ? [...field.value, purpose]
                                  : field.value.filter((item) => item !== purpose),
                              )
                            }}
                          />
                        }
                        label={t(`purposes.${purpose}`)}
                        sx={getPurposeOptionStyles(active)}
                      />
                    )
                  })}
                </Box>
              )}
            />
          </Box>
        </Box>
      </Box>

      <Stack spacing={2.2}>
        <PropertyOwnerSelect control={control} />
        <PropertyOwnerAccessSelect control={control} />
        <Controller
          control={control}
          name="title"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              fullWidth
              label={t('fields.title')}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              fullWidth
              multiline
              minRows={4}
              label={t('fields.description')}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
      </Stack>
    </>
  )
}
