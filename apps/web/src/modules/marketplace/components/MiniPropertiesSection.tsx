'use client'

import { Box, Container, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { featuredPropertiesCount, defaultSearchPurpose } from '../config/home'
import type { HomePropertySectionProps } from '../types/search'
import { useRecentProperties } from '../hooks/use-featured-properties'
import { styles } from '../styles/mini-properties-section.styles'
import { MiniPropertyCard } from './MiniPropertyCard'

export function MiniPropertiesSection({
  purpose = defaultSearchPurpose,
}: HomePropertySectionProps) {
  const t = useTranslations('marketplace.home.miniProperties')
  const { properties } = useRecentProperties(2, featuredPropertiesCount, purpose)

  if (!properties.length) return null

  return (
    <Box component="section" sx={styles.section} aria-label={t('eyebrow')}>
      <Container maxWidth="xl">
        <Typography align="center" sx={styles.eyebrow}>
          {t('eyebrow')}
        </Typography>
        <Box sx={styles.grid}>
          {properties.map((property) => (
            <MiniPropertyCard key={property.id} property={property} />
          ))}
        </Box>
      </Container>
    </Box>
  )
}
