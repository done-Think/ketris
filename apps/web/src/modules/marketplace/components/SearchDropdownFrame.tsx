import { Box } from '@mui/material'
import type { ReactNode } from 'react'

import { radius, shadows, surface, zIndex } from '@shared/theme/tokens'

import type { SearchFilterKey } from '../config/search-filters'

type SearchDropdownFrameProps = {
  filterKey: SearchFilterKey
  children: ReactNode
}

export function SearchDropdownFrame({ filterKey, children }: SearchDropdownFrameProps) {
  const isPriceRange = filterKey === 'priceRange'

  return (
    <Box
      onClick={(event) => event.stopPropagation()}
      sx={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: isPriceRange ? 'auto' : 0,
        right: isPriceRange ? 0 : 'auto',
        width: '100%',
        maxWidth: 'calc(100vw - 32px)',
        zIndex: zIndex.dropdown,
        display: { xs: 'none', md: 'block' },
        borderRadius: `${radius.sm}px`,
        bgcolor: surface.paper,
        color: 'text.primary',
        boxShadow: shadows.popover,
        overflow: isPriceRange ? 'visible' : 'hidden',
      }}
    >
      {children}
    </Box>
  )
}
