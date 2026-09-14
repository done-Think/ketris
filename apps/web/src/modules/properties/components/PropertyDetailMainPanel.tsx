import { Box, Chip, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { dashboardPropertyActivityToneStyles } from '../config/dashboard-property-ui'
import type { PropertyDetailMainPanelProps } from '../types/dashboard-property'
import { PropertyDetailPanel } from './PropertyDetailPanel'

export function PropertyDetailMainPanel({ property, activeTab }: PropertyDetailMainPanelProps) {
  const t = useTranslations('properties.detail')
  const summaryItems = [
    { label: t('summary.type'), value: property.type },
    { label: t('summary.purpose'), value: property.purpose },
    { label: t('summary.bedrooms'), value: property.summary.bedrooms },
    { label: t('summary.bathrooms'), value: property.summary.bathrooms },
    { label: t('summary.parkingSpaces'), value: property.summary.parkingSpaces },
    { label: t('summary.area'), value: property.summary.area },
    { label: t('summary.condominium'), value: property.summary.condominium },
    { label: t('summary.iptu'), value: property.summary.iptu },
  ]
  const pricingItems = [
    { label: t('pricing.rent'), value: property.pricing.rent },
    { label: t('pricing.sale'), value: property.pricing.sale },
    { label: t('pricing.condominium'), value: property.pricing.condominium },
    { label: t('pricing.iptu'), value: property.pricing.iptu },
    { label: t('pricing.administrationFee'), value: property.pricing.administrationFee },
    { label: t('pricing.securityDeposit'), value: property.pricing.securityDeposit },
    { label: t('pricing.lastAdjustment'), value: property.pricing.lastAdjustment },
  ]

  if (activeTab === 'data') {
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
          <Typography sx={{ fontSize: 24, fontWeight: 900, mb: 3 }}>{t('summaryTitle')}</Typography>
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
                <Typography sx={{ color: brand.neutral[400], fontSize: 13, fontWeight: 900 }}>
                  {item.label}
                </Typography>
                <Typography sx={{ color: 'text.primary', fontSize: 18, fontWeight: 900 }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </>
    )
  }

  if (activeTab === 'media') {
    return (
      <PropertyDetailPanel title={t('mediaTitle')}>
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
                <Typography sx={{ fontSize: 15, fontWeight: 900 }}>{media.label}</Typography>
                <Chip
                  label={media.kind}
                  size="small"
                  sx={{
                    height: 22,
                    borderRadius: `${radius.sm}px`,
                    bgcolor: alpha.graphite[6],
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                />
              </Stack>
            </Box>
          ))}
        </Box>
      </PropertyDetailPanel>
    )
  }

  if (activeTab === 'values') {
    return (
      <PropertyDetailPanel title={t('valuesTitle')}>
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
              <Typography sx={{ color: brand.neutral[400], fontSize: 12, fontWeight: 900 }}>
                {item.label}
              </Typography>
              <Typography sx={{ fontSize: 17, fontWeight: 900 }}>{item.value}</Typography>
            </Box>
          ))}
        </Box>
      </PropertyDetailPanel>
    )
  }

  return (
    <PropertyDetailPanel title={t('historyTitle')}>
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
              <Typography sx={{ fontSize: 16, fontWeight: 900 }}>{activity.label}</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                {activity.date}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </PropertyDetailPanel>
  )
}
