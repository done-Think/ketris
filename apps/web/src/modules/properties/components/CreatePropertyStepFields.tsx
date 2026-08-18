import { Box, Checkbox, FormControlLabel, MenuItem, Stack, Typography } from '@mui/material'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { Controller } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import { alpha, componentText, motion, radius, surface } from '@shared/theme/tokens'

import {
  createPropertyFeatureOptions,
  createPropertyMediaSlots,
  createPropertyPublishingOptions,
  createPropertyPurposeOptions,
  createPropertyTypeOptions,
} from '../config/dashboard-property-ui'
import type { CreatePropertyStepFieldsProps } from '../types/dashboard-property'

export function CreatePropertyStepFields({
  activeStepKey,
  activeStepLabel,
  control,
  propertyPurpose,
}: CreatePropertyStepFieldsProps) {
  return (
    <>
      <Typography sx={{ color: 'primary.main', ...componentText.dashboardFieldLabel, mb: 2.2 }}>
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
            <Box>
              <Typography sx={{ ...componentText.dashboardFieldLabel, mb: 0.8 }}>
                Tipo de imóvel
              </Typography>
              <RhfTextField
                control={control}
                name="type"
                select
                fullWidth
                slotProps={{
                  select: { IconComponent: KeyboardArrowDownRoundedIcon },
                  htmlInput: { 'aria-label': 'Tipo de imóvel' },
                }}
              >
                {createPropertyTypeOptions.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </RhfTextField>
            </Box>

            <Box>
              <Typography sx={{ ...componentText.dashboardFieldLabel, mb: 0.8 }}>
                Finalidade
              </Typography>
              <Controller
                control={control}
                name="purpose"
                render={({ field }) => (
                  <Box
                    role="group"
                    aria-label="Finalidade"
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      minHeight: 44,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: `${radius.sm}px`,
                      overflow: 'hidden',
                      bgcolor: surface.paper,
                    }}
                  >
                    {createPropertyPurposeOptions.map((purpose) => {
                      const active = purpose === field.value

                      return (
                        <Box
                          key={purpose}
                          component="button"
                          type="button"
                          aria-pressed={active}
                          onClick={() => field.onChange(purpose)}
                          sx={{
                            border: 0,
                            cursor: 'pointer',
                            font: 'inherit',
                            color: active ? surface.lightText : 'text.secondary',
                            bgcolor: active ? 'primary.main' : surface.paper,
                            ...componentText.dashboardActionLabel,
                            transition: motion.transition.interactive,
                            '&:hover': {
                              bgcolor: active ? 'primary.dark' : alpha.graphite[6],
                            },
                          }}
                        >
                          {purpose}
                        </Box>
                      )
                    })}
                  </Box>
                )}
              />
            </Box>
          </Box>

          <Stack spacing={2.2}>
            <Box>
              <Typography sx={{ ...componentText.dashboardFieldLabel, mb: 0.8 }}>
                Título do anúncio
              </Typography>
              <RhfTextField
                control={control}
                name="title"
                fullWidth
                placeholder="Ex.: Apartamento com 3 quartos nos Jardins"
                slotProps={{ htmlInput: { 'aria-label': 'Título do anúncio' } }}
              />
            </Box>

            <Box>
              <Typography sx={{ ...componentText.dashboardFieldLabel, mb: 0.8 }}>
                Descrição
              </Typography>
              <RhfTextField
                control={control}
                name="description"
                fullWidth
                multiline
                minRows={4}
                placeholder="Descreva os diferenciais do imóvel, a localização e o entorno"
                slotProps={{ htmlInput: { 'aria-label': 'Descrição' } }}
              />
            </Box>
          </Stack>
        </>
      ) : null}

      {activeStepKey === 'address' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 2,
          }}
        >
          <RhfTextField control={control} name="street" label="Endereço" />
          <RhfTextField control={control} name="number" label="Número" />
          <RhfTextField control={control} name="neighborhood" label="Bairro" />
          <RhfTextField control={control} name="city" label="Cidade" />
          <RhfTextField control={control} name="state" label="Estado" />
          <RhfTextField control={control} name="zipCode" label="CEP" />
        </Box>
      ) : null}

      {activeStepKey === 'features' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          <RhfTextField control={control} name="bedrooms" label="Quartos" type="number" />
          <RhfTextField control={control} name="bathrooms" label="Banheiros" type="number" />
          <RhfTextField control={control} name="parkingSpaces" label="Vagas" type="number" />
          <RhfTextField control={control} name="area" label="Área útil (m²)" type="number" />

          <Controller
            control={control}
            name="features"
            render={({ field }) => (
              <>
                {createPropertyFeatureOptions.map((feature) => (
                  <FormControlLabel
                    key={feature}
                    control={
                      <Checkbox
                        size="small"
                        checked={field.value.includes(feature)}
                        onChange={(_, checked) =>
                          field.onChange(
                            checked
                              ? [...field.value, feature]
                              : field.value.filter((current) => current !== feature),
                          )
                        }
                      />
                    }
                    label={<Typography sx={componentText.dashboardItemBody}>{feature}</Typography>}
                    sx={{
                      m: 0,
                      minHeight: 44,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: `${radius.sm}px`,
                      px: 1,
                    }}
                  />
                ))}
              </>
            )}
          />
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
            <Box
              key={label}
              sx={{
                minHeight: 150,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: `${radius.sm}px`,
                bgcolor: alpha.graphite[6],
                display: 'grid',
                placeItems: 'center',
                px: 2,
                textAlign: 'center',
              }}
            >
              <Typography sx={componentText.dashboardActionLabel}>{label}</Typography>
            </Box>
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
          {propertyPurpose === 'Aluguel' ? (
            <RhfTextField
              control={control}
              name="rentPrice"
              label="Valor do aluguel"
              type="number"
            />
          ) : (
            <RhfTextField control={control} name="salePrice" label="Valor de venda" type="number" />
          )}
          <RhfTextField control={control} name="condominium" label="Condomínio" type="number" />
          <RhfTextField control={control} name="iptu" label="IPTU mensal" type="number" />
          <RhfTextField
            control={control}
            name="warranty"
            label={propertyPurpose === 'Aluguel' ? 'Garantia' : 'Comissão'}
          />
        </Box>
      ) : null}

      {activeStepKey === 'publishing' ? (
        <Controller
          control={control}
          name="publishing"
          render={({ field }) => (
            <Stack spacing={1.6}>
              {createPropertyPublishingOptions.map((option) => (
                <FormControlLabel
                  key={option}
                  control={
                    <Checkbox
                      size="small"
                      checked={field.value.includes(option)}
                      onChange={(_, checked) =>
                        field.onChange(
                          checked
                            ? [...field.value, option]
                            : field.value.filter((current) => current !== option),
                        )
                      }
                    />
                  }
                  label={<Typography sx={componentText.dashboardItemBody}>{option}</Typography>}
                  sx={{
                    m: 0,
                    minHeight: 44,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: `${radius.sm}px`,
                    px: 1,
                  }}
                />
              ))}
            </Stack>
          )}
        />
      ) : null}
    </>
  )
}
