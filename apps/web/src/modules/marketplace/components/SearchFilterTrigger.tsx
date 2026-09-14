import { Box, Button, Typography } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { useTranslations } from 'next-intl'

import { alpha, componentText, iconSize, radius } from '@shared/theme/tokens'

import { searchOptions } from '../config/search-filters'
import type { SearchFilterTriggerProps } from '../types/search'

export function SearchFilterTrigger({ filterKey, value, onOpen }: SearchFilterTriggerProps) {
  const t = useTranslations('marketplace.home.search.filters')

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
          {t(searchOptions[filterKey].labelKey)}
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
