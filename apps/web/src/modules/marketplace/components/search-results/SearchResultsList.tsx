'use client'

import { Box, Typography } from '@mui/material'

import { radius, surface } from '@shared/theme/tokens'

import type { SearchResultsListProps } from '../../types/search-results'
import { SearchPropertyCard } from '../SearchPropertyCard'

export function SearchResultsList({
  properties,
  selectedPropertyId,
  setSelectedPropertyId,
  viewMode,
}: SearchResultsListProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns:
          viewMode === 'grid' ? { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } : '1fr',
        gap: { xs: 2, xl: 2.5 },
      }}
    >
      {properties.length ? (
        properties.map((property) => (
          <SearchPropertyCard
            key={property.id}
            property={property}
            selected={property.id === selectedPropertyId}
            onActivate={() => setSelectedPropertyId(property.id)}
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
          <Typography sx={{ fontWeight: 900, mb: 0.5 }}>Nenhum imóvel encontrado</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 700 }}>
            Ajuste os filtros para ver mais opções.
          </Typography>
        </Box>
      )}
    </Box>
  )
}
