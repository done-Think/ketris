import {
  Box,
  Button,
  Checkbox,
  FormControl,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'

import { alpha, motion, radius, surface } from '@shared/theme/tokens'

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
  propertyPurpose,
  onPropertyPurposeChange,
}: CreatePropertyStepFieldsProps) {
  return (
    <>
      <Typography sx={{ color: 'primary.main', fontSize: 13, fontWeight: 900, mb: 2.2 }}>
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
              <Typography sx={{ fontSize: 13, fontWeight: 900, mb: 0.8 }}>
                Tipo de imóvel
              </Typography>
              <Select
                defaultValue="Apartamento"
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
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 900, mb: 0.8 }}>Finalidade</Typography>
              <Box
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
                  const active = purpose === propertyPurpose

                  return (
                    <Button
                      key={purpose}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onPropertyPurposeChange(purpose)}
                      sx={{
                        borderRadius: 0,
                        color: active ? surface.lightText : 'text.secondary',
                        bgcolor: active ? 'primary.main' : surface.paper,
                        fontWeight: 900,
                        transition: motion.transition.interactive,
                        '&:hover': {
                          bgcolor: active ? 'primary.dark' : alpha.graphite[6],
                        },
                      }}
                    >
                      {purpose}
                    </Button>
                  )
                })}
              </Box>
            </Box>
          </Box>

          <Stack spacing={2.2}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 900, mb: 0.8 }}>
                Título do anúncio
              </Typography>
              <TextField
                fullWidth
                defaultValue="Apartamento moderno com vista incrível nos Jardins"
                slotProps={{ htmlInput: { 'aria-label': 'Título do anúncio' } }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 900, mb: 0.8 }}>Descrição</Typography>
              <TextField
                fullWidth
                multiline
                minRows={4}
                defaultValue="Excelente apartamento mobiliado, com 3 quartos, varanda gourmet espaçosa e 2 vagas de garagem demarcadas. Localização nobre, próximo a comércio especializado, restaurantes premiados e estação de metrô."
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
          <TextField label="Endereço" defaultValue="Alameda Lorena" />
          <TextField label="Número" defaultValue="1420" />
          <TextField label="Bairro" defaultValue="Jardins" />
          <TextField label="Cidade" defaultValue="São Paulo" />
          <TextField label="Estado" defaultValue="SP" />
          <TextField label="CEP" defaultValue="01424-001" />
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
          <TextField label="Quartos" type="number" defaultValue={3} />
          <TextField label="Banheiros" type="number" defaultValue={2} />
          <TextField label="Vagas" type="number" defaultValue={2} />
          <TextField label="Área útil" defaultValue="95m²" />
          {createPropertyFeatureOptions.map((feature) => (
            <Stack
              key={feature}
              direction="row"
              alignItems="center"
              spacing={0.8}
              sx={{
                minHeight: 44,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: `${radius.sm}px`,
                px: 1,
              }}
            >
              <Checkbox defaultChecked size="small" />
              <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{feature}</Typography>
            </Stack>
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
              <Typography sx={{ fontWeight: 900 }}>{label}</Typography>
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
          <TextField
            label={propertyPurpose === 'Aluguel' ? 'Valor do aluguel' : 'Valor de venda'}
            defaultValue={propertyPurpose === 'Aluguel' ? 'R$ 6.500' : 'R$ 1.420.000'}
          />
          <TextField label="Condomínio" defaultValue="R$ 1.200" />
          <TextField label="IPTU mensal" defaultValue="R$ 380" />
          <TextField
            label={propertyPurpose === 'Aluguel' ? 'Garantia' : 'Comissão'}
            defaultValue={propertyPurpose === 'Aluguel' ? '3 aluguéis' : '2% na venda'}
          />
        </Box>
      ) : null}

      {activeStepKey === 'publishing' ? (
        <Stack spacing={1.6}>
          {createPropertyPublishingOptions.map((option, index) => (
            <Stack
              key={option}
              direction="row"
              alignItems="center"
              spacing={0.8}
              sx={{
                minHeight: 44,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: `${radius.sm}px`,
                px: 1,
              }}
            >
              <Checkbox defaultChecked={index < 2} size="small" />
              <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{option}</Typography>
            </Stack>
          ))}
        </Stack>
      ) : null}
    </>
  )
}
