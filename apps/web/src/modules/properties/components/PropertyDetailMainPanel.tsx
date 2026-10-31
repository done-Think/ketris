import { styles, getActivityDotStyles } from '../styles/property-detail-main-panel.styles'
import { Box, Chip, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { PropertyDetailMainPanelProps } from '../types/dashboard-property'
import { PropertyDetailPanel } from './PropertyDetailPanel'

export function PropertyDetailMainPanel({ property, activeTab }: PropertyDetailMainPanelProps) {
  const t = useTranslations('properties.detail')
  const featureT = useTranslations('properties.create.features')
  const summaryItems = [
    { label: t('summary.type'), value: property.type },
    { label: t('summary.purpose'), value: property.purpose },
    { label: t('summary.bedrooms'), value: property.summary.bedrooms },
    { label: t('summary.bathrooms'), value: property.summary.bathrooms },
    { label: t('summary.parkingSpaces'), value: property.summary.parkingSpaces },
    { label: t('summary.area'), value: property.summary.area },
    { label: t('summary.condominium'), value: property.summary.condominium },
    { label: t('summary.propertyTax'), value: property.summary.propertyTax },
  ]
  const pricingItems = [
    { label: t('pricing.rent'), value: property.pricing.rent },
    { label: t('pricing.sale'), value: property.pricing.sale },
    { label: t('pricing.condominium'), value: property.pricing.condominium },
    { label: t('pricing.propertyTax'), value: property.pricing.propertyTax },
    ...(property.listing.negotiationTerms
      ? [{ label: t('negotiationTerms'), value: property.listing.negotiationTerms }]
      : []),
  ]

  if (activeTab === 'data') {
    return (
      <>
        {property.heroImageUrl ? (
          <Box component="img" src={property.heroImageUrl} alt="" sx={styles.box} />
        ) : null}

        <Box sx={styles.box2}>
          <Typography sx={styles.typography}>{t('summaryTitle')}</Typography>
          <Box sx={styles.box3}>
            {summaryItems.map((item) => (
              <Box key={item.label}>
                <Typography sx={styles.typography2}>{item.label}</Typography>
                <Typography sx={styles.typography3}>{item.value}</Typography>
              </Box>
            ))}
          </Box>
          {property.description ? (
            <Box sx={styles.listingSection}>
              <Typography sx={styles.typography2}>{t('description')}</Typography>
              <Typography sx={styles.listingText}>{property.description}</Typography>
            </Box>
          ) : null}
          {property.listing.amenities.length > 0 ? (
            <Box sx={styles.listingSection}>
              <Typography sx={styles.typography2}>{t('amenities')}</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {property.listing.amenities.map((amenity) => (
                  <Chip key={amenity} label={featureT(amenity)} size="small" />
                ))}
              </Stack>
            </Box>
          ) : null}
        </Box>
      </>
    )
  }

  if (activeTab === 'media') {
    return (
      <PropertyDetailPanel title={t('mediaTitle')}>
        <Box sx={styles.box4}>
          {property.media.map((media) => (
            <Box key={`${media.label}-${media.url}`}>
              <Box component="img" src={media.url} alt={media.label} sx={styles.box5} />
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography sx={styles.typography4}>{media.label}</Typography>
                <Chip label={t(`mediaKinds.${media.kind}`)} size="small" sx={styles.chip} />
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
        <Box sx={styles.box6}>
          {pricingItems.map((item) => (
            <Box key={item.label} sx={styles.box7}>
              <Typography sx={styles.typography5}>{item.label}</Typography>
              <Typography sx={styles.typography6}>{item.value}</Typography>
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
            <Box sx={getActivityDotStyles(activity.tone)} />
            <Box>
              <Typography sx={styles.typography7}>{activity.label}</Typography>
              <Typography sx={styles.typography8}>{activity.date}</Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </PropertyDetailPanel>
  )
}
