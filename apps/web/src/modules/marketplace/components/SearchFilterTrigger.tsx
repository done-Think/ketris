import { Box, Button, Typography } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'

import { alpha, componentText, iconSize, radius } from '@shared/theme/tokens'

import { searchOptions, type SearchFilterKey } from '../config/search-filters'

type SearchFilterTriggerProps = {
  filterKey: SearchFilterKey
  value: string
  onOpen: (key: SearchFilterKey) => void
}

export function SearchFilterTrigger({ filterKey, value, onOpen }: SearchFilterTriggerProps) {
  return (
    <Button
      fullWidth
      onClick={(event) => {
        event.stopPropagation()
        onOpen(filterKey)
      }}
      endIcon={<KeyboardArrowDownIcon sx={{ fontSize: iconSize.lg }} />}
      sx={{
        justifyContent: 'space-between',
        alignItems: 'center',
        minWidth: 0,
        minHeight: { md: 40, xl: 55 },
        px: { xs: 1, md: 1.25, xl: 2 },
        py: { md: 0.35, xl: 0.6 },
        color: 'text.primary',
        borderRadius: `${radius.sm}px`,
        textAlign: 'left',
        ...componentText.resetButtonText,
        '& .MuiButton-endIcon': {
          color: 'text.disabled',
          ml: 1,
        },
        '&:hover': {
          bgcolor: alpha.magenta[6],
        },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: 'text.disabled',
            ...componentText.filterLabel,
          }}
        >
          {searchOptions[filterKey].label}
        </Typography>
        <Typography
          sx={{
            color: 'text.primary',
            ...componentText.filterValue,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </Typography>
      </Box>
    </Button>
  )
}
