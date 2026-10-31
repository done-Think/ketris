'use client'

import { Box } from '@mui/material'

import type { SearchResultsMapPanelProps } from '../../types/search'
import { SearchResultsMap } from '../SearchResultsMap'
import { styles } from '../../styles/search-results-map-panel.styles'

export function SearchResultsMapPanel({
  properties,
  selectedPropertyId,
  setSelectedPropertyId,
  searchQuery,
  viewerLocation,
  locationUpdatedAt,
}: SearchResultsMapPanelProps) {
  return (
    <Box sx={styles.box}>
      <SearchResultsMap
        locationUpdatedAt={locationUpdatedAt}
        viewerLocation={viewerLocation}
        properties={properties}
        selectedPropertyId={selectedPropertyId}
        onSelectProperty={setSelectedPropertyId}
        searchQuery={searchQuery}
      />
    </Box>
  )
}
