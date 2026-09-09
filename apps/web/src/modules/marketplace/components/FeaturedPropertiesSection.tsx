import { Box, Container } from '@mui/material'
import NorthEastOutlinedIcon from '@mui/icons-material/NorthEastOutlined'
import { useTranslations } from 'next-intl'

import { ActionTextLink, PropertyCard, SectionHeader } from '@shared/components/ui'
import { iconSize, surface, zIndex } from '@shared/theme/tokens'

import { featuredProperties } from '../data/featured-properties'
import { buildPropertyDetailHref } from '../utils/property-links'
import { getPropertyPurposeFromPrice } from '../utils/property-details-link'

export function FeaturedPropertiesSection() {
  const t = useTranslations('marketplace.home.featured')

  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        zIndex: zIndex.content,
        bgcolor: surface.app,
        pt: { xs: 1.25, md: 3 },
        pb: { xs: 5, md: 7 },
      }}
    >
      <Container maxWidth="xl">
        <SectionHeader
          title={t('title')}
          action={
            <ActionTextLink href="/properties">
              {t('viewAll')}
              <NorthEastOutlinedIcon sx={{ fontSize: iconSize.xs }} />
            </ActionTextLink>
          }
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: { xs: 2, md: 3 },
          }}
        >
          {featuredProperties.map((property) => {
            const detailsHref = buildPropertyDetailHref(
              property.href,
              getPropertyPurposeFromPrice(property.price),
            )

            return <PropertyCard key={property.title} href={detailsHref} property={property} />
          })}
        </Box>
      </Container>
    </Box>
  )
}
