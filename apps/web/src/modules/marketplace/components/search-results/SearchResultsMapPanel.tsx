'use client'

import { Box } from '@mui/material'

import type { SearchResultProperty } from '../../types/search'
import { SearchResultsMap } from '../SearchResultsMap'

type SearchResultsMapPanelProps = {
  properties: SearchResultProperty[]
  selectedPropertyId: string
  setSelectedPropertyId: (propertyId: string) => void
}

export function SearchResultsMapPanel({
  properties,
  selectedPropertyId,
  setSelectedPropertyId,
}: SearchResultsMapPanelProps) {
  return (
    <Box
      sx={{
        display: { xs: 'none', lg: 'block' },
        alignSelf: 'start',
        position: { lg: 'sticky' },
        top: { lg: 68 },
        height: { lg: 'calc(100vh - 76px)' },
        minHeight: { lg: 620 },
        minWidth: 0,
        p: 1,
        pl: 0,
      }}
    >
      <SearchResultsMap
        properties={properties}
        selectedPropertyId={selectedPropertyId}
        onSelectProperty={setSelectedPropertyId}
      />
    </Box>
  )
}
