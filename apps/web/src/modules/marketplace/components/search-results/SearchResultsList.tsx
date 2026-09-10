'use client'

import { Box, Skeleton, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { radius, surface } from '@shared/theme/tokens'

import type { SearchResultProperty, ViewMode } from '../../types/search'
import { SearchPropertyCard } from '../SearchPropertyCard'

type SearchResultsListProps = {
  properties: SearchResultProperty[]
  isLoading?: boolean
  selectedPropertyId: string
  setSelectedPropertyId: (propertyId: string) => void
  viewMode: ViewMode
}

export function SearchResultsList({
  properties,
  isLoading = false,
  selectedPropertyId,
  setSelectedPropertyId,
  viewMode,
}: SearchResultsListProps) {
  const t = useTranslations('marketplace.searchResults.empty')

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns:
          viewMode === 'grid' ? { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } : '1fr',
        gap: { xs: 2, xl: 2.5 },
      }}
    >
      {isLoading ? (
        [0, 1, 2, 3].map((index) => (
          <Skeleton key={index} variant="rounded" height={320} sx={{ borderRadius: 1.5 }} />
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
        <Box
          sx={{
            gridColumn: '1 / -1',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.paper,
            px: 2,
            py: 4,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontWeight: 900, mb: 0.5 }}>{t('title')}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 700 }}>
            {t('description')}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
