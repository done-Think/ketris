'use client'

import { Box, Container, Skeleton } from '@mui/material'
import NorthEastOutlinedIcon from '@mui/icons-material/NorthEastOutlined'
import { useTranslations } from 'next-intl'

import { ActionTextLink, PropertyCard, SectionHeader } from '@shared/components/ui'

import { useFeaturedProperties } from '../hooks/use-featured-properties'
import { defaultSearchPurpose } from '../config/home'
import type { HomePropertySectionProps } from '../types/search'
import { styles } from '../styles/featured-properties-section.styles'

export function FeaturedPropertiesSection({
  purpose = defaultSearchPurpose,
}: HomePropertySectionProps) {
  const t = useTranslations('marketplace.home.featured')
  const { featuredProperties, isLoading, isError } = useFeaturedProperties(purpose)

  if (!isLoading && (isError || featuredProperties.length === 0)) return null

  return (
    <Box component="section" sx={styles.box}>
      <Container maxWidth="xl">
        <SectionHeader
          title={t('title')}
          action={
            <ActionTextLink href={{ pathname: '/properties', query: { purpose } }}>
              {t('viewAll')}
              <NorthEastOutlinedIcon sx={styles.northEastOutlinedIcon} />
            </ActionTextLink>
          }
        />

        <Box sx={styles.box2}>
          {isLoading
            ? Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} variant="rounded" height={340} sx={styles.skeleton} />
              ))
            : featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
        </Box>
      </Container>
    </Box>
  )
}
