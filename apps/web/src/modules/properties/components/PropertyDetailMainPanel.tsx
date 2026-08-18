import { Box, Chip, Stack, Typography } from '@mui/material'

import { alpha, brand, componentText, radius, shadows, surface } from '@shared/theme/tokens'

import { dashboardPropertyActivityToneStyles } from '../config/dashboard-property-ui'
import type { PropertyDetailMainPanelProps } from '../types/dashboard-property'
import { PropertyDetailPanel } from './PropertyDetailPanel'

export function PropertyDetailMainPanel({ property, activeTab }: PropertyDetailMainPanelProps) {
  const summaryItems = [
    { label: 'TIPO', value: property.type },
    { label: 'FINALIDADE', value: property.purpose },
    { label: 'QUARTOS', value: property.summary.bedrooms },
    { label: 'BANHEIROS', value: property.summary.bathrooms },
    { label: 'VAGAS', value: property.summary.parkingSpaces },
    { label: 'ÁREA', value: property.summary.area },
    { label: 'CONDOMÍNIO', value: property.summary.condominium },
    { label: 'IPTU', value: property.summary.iptu },
  ]
  const pricingItems = [
    { label: 'ALUGUEL', value: property.pricing.rent },
    { label: 'VENDA', value: property.pricing.sale },
    { label: 'CONDOMÍNIO', value: property.pricing.condominium },
    { label: 'IPTU', value: property.pricing.iptu },
    { label: 'TAXA DE ADMINISTRAÇÃO', value: property.pricing.administrationFee },
    { label: 'GARANTIA', value: property.pricing.securityDeposit },
    { label: 'ÚLTIMO AJUSTE', value: property.pricing.lastAdjustment },
  ]

  if (activeTab === 'Dados') {
    return (
      <>
        <Box
          component="img"
          src={property.heroImageUrl}
          alt=""
          sx={{
            display: 'block',
            width: '100%',
            height: { xs: 260, md: 430 },
            objectFit: 'cover',
            borderRadius: `${radius.md}px`,
            mb: 3.2,
          }}
        />

        <Box
          sx={{
            bgcolor: surface.paper,
            border: '1px solid',
            borderColor: alpha.graphite[6],
            borderRadius: `${radius.md}px`,
            boxShadow: shadows.propertyCard,
            px: { xs: 2.2, md: 3.2 },
            py: { xs: 2.4, md: 3.2 },
          }}
        >
          <Typography sx={{ ...componentText.dashboardPanelHeading, mb: 3 }}>
            Resumo do Imóvel
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, 1fr)' },
              rowGap: 2.6,
              columnGap: 3,
            }}
          >
            {summaryItems.map((item) => (
              <Box key={item.label}>
                <Typography
                  sx={{ color: brand.neutral[400], ...componentText.dashboardFieldLabel }}
                >
                  {item.label}
                </Typography>
                <Typography sx={{ color: 'text.primary', ...componentText.dashboardGroupTitle }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </>
    )
  }

  if (activeTab === 'Mídia') {
    return (
      <PropertyDetailPanel title="Mídia">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {property.media.map((media) => (
            <Box key={`${media.label}-${media.url}`}>
              <Box
                component="img"
                src={media.url}
                alt={media.label}
                sx={{
                  display: 'block',
                  width: '100%',
                  aspectRatio: '16 / 10',
                  objectFit: 'cover',
                  borderRadius: `${radius.sm}px`,
                  mb: 1,
                }}
              />
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography sx={{ ...componentText.dashboardItemLabel }}>{media.label}</Typography>
                <Chip
                  label={media.kind}
                  size="small"
                  sx={{
                    height: 22,
                    borderRadius: `${radius.sm}px`,
                    bgcolor: alpha.graphite[6],
                    ...componentText.dashboardTag,
                  }}
                />
              </Stack>
            </Box>
          ))}
        </Box>
      </PropertyDetailPanel>
    )
  }

  if (activeTab === 'Valores') {
    return (
      <PropertyDetailPanel title="Valores">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 1.4,
          }}
        >
          {pricingItems.map((item) => (
            <Box
              key={item.label}
              sx={{
                border: '1px solid',
                borderColor: alpha.graphite[6],
                borderRadius: `${radius.sm}px`,
                px: 1.8,
                py: 1.5,
              }}
            >
              <Typography sx={{ color: brand.neutral[400], ...componentText.dashboardFieldLabel }}>
                {item.label}
              </Typography>
              <Typography sx={{ ...componentText.dashboardMetricValue }}>{item.value}</Typography>
            </Box>
          ))}
        </Box>
      </PropertyDetailPanel>
    )
  }

  return (
    <PropertyDetailPanel title="Histórico completo">
      <Stack spacing={2.1}>
        {property.activityHistory.map((activity) => (
          <Stack key={`${activity.label}-${activity.date}`} direction="row" spacing={1.7}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: `${radius.full}px`,
                bgcolor: dashboardPropertyActivityToneStyles[activity.tone],
                mt: 0.8,
                flexShrink: 0,
              }}
            />
            <Box>
              <Typography sx={{ ...componentText.dashboardItemTitle }}>{activity.label}</Typography>
              <Typography sx={{ color: 'text.secondary', ...componentText.dashboardCaption }}>
                {activity.date}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </PropertyDetailPanel>
  )
}
