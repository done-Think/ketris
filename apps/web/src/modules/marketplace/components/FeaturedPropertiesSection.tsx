import { Box, Container, Skeleton } from '@mui/material'
import NorthEastOutlinedIcon from '@mui/icons-material/NorthEastOutlined'
import { useTranslations } from 'next-intl'

import { ActionTextLink, PropertyCard, SectionHeader } from '@shared/components/ui'
import { iconSize, radius, surface, zIndex } from '@shared/theme/tokens'

import { useFeaturedProperties } from '../hooks/use-featured-properties'

export function FeaturedPropertiesSection() {
  const t = useTranslations('marketplace.home.featured')
  const { featuredProperties, isLoading, isError } = useFeaturedProperties()

  if (!isLoading && (isError || featuredProperties.length === 0)) return null

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
          {isLoading
            ? Array.from({ length: 3 }, (_, index) => (
                <Skeleton
                  key={index}
                  variant="rounded"
                  height={340}
                  sx={{ borderRadius: `${radius.sm}px` }}
                />
              ))
            : featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
        </Box>
      </Container>
    </Box>
  )
}
