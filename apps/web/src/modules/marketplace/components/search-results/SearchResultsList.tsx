'use client'

import { Box, Skeleton, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { SearchResultsListProps } from '../../types/search'
import { SearchPropertyCard } from '../SearchPropertyCard'
import { styles, getBoxStyles } from '../../styles/search-results-list.styles'

export function SearchResultsList({
  properties,
  isLoading = false,
  selectedPropertyId,
  setSelectedPropertyId,
  viewMode,
}: SearchResultsListProps) {
  const t = useTranslations('marketplace.searchResults.empty')

  return (
    <Box sx={getBoxStyles({ viewMode })}>
      {isLoading ? (
        [0, 1, 2, 3].map((index) => (
          <Skeleton key={index} variant="rounded" height={320} sx={styles.skeleton} />
        ))
      ) : properties.length ? (
        properties.map((property) => (
          <SearchPropertyCard
            key={property.id}
            property={property}
            selected={property.id === selectedPropertyId}
            onActivate={() => setSelectedPropertyId(property.id)}
            viewMode={viewMode}
          />
        ))
      ) : (
        <Box sx={styles.box}>
          <Typography sx={styles.typography}>{t('title')}</Typography>
          <Typography sx={styles.typography2}>{t('description')}</Typography>
        </Box>
      )}
    </Box>
  )
}
