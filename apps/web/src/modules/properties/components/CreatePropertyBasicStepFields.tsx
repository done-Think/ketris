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

import { brand, iconSize, motion, radius, surface } from '@shared/theme/tokens'

import {
  createPropertyPurposeOptions,
  createPropertyTypeOptions,
} from '../config/dashboard-property-ui'
import type { CreatePropertyBasicStepFieldsProps } from '../types/dashboard-property'

export function CreatePropertyBasicStepFields({ control }: CreatePropertyBasicStepFieldsProps) {
  const t = useTranslations('properties.create')

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
          gap: { xs: 2, md: 2.4 },
          mb: 2.4,
        }}
      >
        <FormControl fullWidth>
          <Typography sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 800, mb: 0.8 }}>
            {t('fields.propertyType')}
          </Typography>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select
                {...field}
                IconComponent={KeyboardArrowDownRoundedIcon}
                sx={{
                  height: 44,
                  borderRadius: `${radius.sm}px`,
                  bgcolor: surface.paper,
                  fontSize: 14,
                }}
              >
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
          <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 800, mb: 0.8 }}>
              {t('fields.purpose')}
            </Typography>
            <Controller
              control={control}
              name="purpose"
              render={({ field }) => (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    columnGap: '10px',
                    rowGap: 0.8,
                  }}
                >
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
                        sx={{
                          minHeight: 44,
                          color: active ? 'primary.main' : 'text.secondary',
                          mx: 0,
                          px: 0,
                          transition: motion.transition.interactive,
                          '& .MuiCheckbox-root': {
                            color: active ? 'primary.main' : brand.neutral[400],
                            p: 0.6,
                            mr: 0.6,
                            '& .MuiSvgIcon-root': {
                              fontSize: iconSize.md,
                            },
                          },
                          '& .MuiFormControlLabel-label': {
                            fontSize: 14,
                            fontWeight: 900,
                            transform: 'translateY(1px)',
                          },
                          '&:hover': {
                            color: 'primary.main',
                          },
                        }}
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
