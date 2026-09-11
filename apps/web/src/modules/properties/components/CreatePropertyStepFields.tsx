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
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import RadioButtonCheckedRoundedIcon from '@mui/icons-material/RadioButtonCheckedRounded'
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded'
import { useTranslations } from 'next-intl'

import { alpha, brand, iconSize, motion, radius, surface } from '@shared/theme/tokens'

import {
  createPropertyFeatureOptions,
  createPropertyMediaSlots,
  createPropertyPublishingOptions,
  createPropertyPurposeOptions,
  createPropertyTypeOptions,
} from '../config/dashboard-property-ui'
import type { CreatePropertyStepFieldsProps } from '../types/dashboard-property'

export function CreatePropertyStepFields({
  control,
  activeStepKey,
  activeStepLabel,
  propertyPurpose,
}: CreatePropertyStepFieldsProps) {
  const t = useTranslations('properties.create')
  const hasRentPurpose = propertyPurpose.includes('Aluguel')
  const hasSalePurpose = propertyPurpose.includes('Venda')
  const mainValueLabel =
    hasRentPurpose && !hasSalePurpose
      ? 'rentValue'
      : hasSalePurpose && !hasRentPurpose
        ? 'saleValue'
        : 'referenceValue'
  const negotiationTermLabel =
    hasRentPurpose && !hasSalePurpose
      ? 'securityDeposit'
      : hasSalePurpose && !hasRentPurpose
        ? 'commission'
        : 'commercialTerms'

  return (
    <>
      <Typography
        sx={{
          color: { xs: brand.neutral[500], md: 'primary.main' },
          fontSize: { xs: 11, md: 13 },
          fontWeight: 900,
          mb: { xs: 1.8, md: 2.2 },
          textTransform: 'uppercase',
        }}
      >
        {activeStepLabel}
      </Typography>

      {activeStepKey === 'basic' ? (
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
              <Typography
                sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 800, mb: 0.8 }}
              >
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
              <Typography
                sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 800, mb: 0.8 }}
              >
                {t('fields.purpose')}
              </Typography>
              <Controller
                control={control}
                name="purpose"
                render={({ field }) => (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: { xs: 0.8, md: 1 },
                      width: { xs: '100%', md: '50%' },
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
                              checkedIcon={<RadioButtonCheckedRoundedIcon />}
                              icon={<RadioButtonUncheckedRoundedIcon />}
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
                                borderRadius: radius.full,
                              },
                            },
                            '& .MuiFormControlLabel-label': {
                              fontSize: 14,
                              fontWeight: 900,
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
      ) : null}

      {activeStepKey === 'address' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: '2fr 1fr' },
            gap: { xs: 1.2, md: 2 },
          }}
        >
          {[
            ['street', 'street'],
            ['number', 'number'],
            ['neighborhood', 'neighborhood'],
            ['city', 'city'],
            ['state', 'state'],
            ['zipCode', 'zipCode'],
          ].map(([name, label]) => (
            <Controller
              key={name}
              control={control}
              name={name as 'street' | 'number' | 'neighborhood' | 'city' | 'state' | 'zipCode'}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label={t(`fields.${label}`)}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  sx={{
                    gridColumn: {
                      xs: name === 'street' || name === 'zipCode' ? '1 / -1' : 'auto',
                    },
                  }}
                />
              )}
            />
          ))}
        </Box>
      ) : null}

      {activeStepKey === 'features' ? (
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
            ['area', 'area', 'text'],
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
      ) : null}

      {activeStepKey === 'media' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {createPropertyMediaSlots.map((label) => (
            <Controller
              key={label}
              control={control}
              name="mediaSlots"
              render={({ field }) => {
                const active = field.value.includes(label)

                return (
                  <Box
                    component="button"
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      field.onChange(
                        active
                          ? field.value.filter((item) => item !== label)
                          : [...field.value, label],
                      )
                    }}
                    sx={{
                      minHeight: 150,
                      border: '1px dashed',
                      borderColor: active ? 'primary.main' : 'divider',
                      borderRadius: `${radius.sm}px`,
                      bgcolor: active ? alpha.magenta[6] : surface.paper,
                      display: 'grid',
                      placeItems: 'center',
                      px: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Stack spacing={0.8} alignItems="center">
                      <CameraAltOutlinedIcon
                        sx={{
                          color: active ? brand.magenta[500] : brand.neutral[500],
                          fontSize: iconSize.xl,
                        }}
                      />
                      <Typography sx={{ color: brand.neutral[500], fontWeight: 900 }}>
                        {t(`mediaSlots.${label}`)}
                      </Typography>
                    </Stack>
                  </Box>
                )
              }}
            />
          ))}
        </Box>
      ) : null}

      {activeStepKey === 'values' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {[
            ['mainValue', mainValueLabel],
            ['condominium', 'condominium'],
            ['iptu', 'iptu'],
            ['negotiationTerm', negotiationTermLabel],
          ].map(([name, label]) => (
            <Controller
              key={name}
              control={control}
              name={name as 'mainValue' | 'condominium' | 'iptu' | 'negotiationTerm'}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label={t(`fields.${label}`)}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          ))}
        </Box>
      ) : null}

      {activeStepKey === 'publishing' ? (
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
      ) : null}
    </>
  )
}
