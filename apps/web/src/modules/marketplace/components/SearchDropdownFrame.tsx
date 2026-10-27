import { Box } from '@mui/material'

import type { SearchDropdownFrameProps } from '../types/search'
import { getBoxStyles } from '../styles/search-dropdown-frame.styles'

export function SearchDropdownFrame({ filterKey, children }: SearchDropdownFrameProps) {
  const isPriceRange = filterKey === 'priceRange'

  return (
    <Box onClick={(event) => event.stopPropagation()} sx={getBoxStyles({ isPriceRange })}>
      {children}
    </Box>
  )
}
