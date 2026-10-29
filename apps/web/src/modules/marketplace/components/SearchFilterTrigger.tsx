import { Box, Button, Typography } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { useTranslations } from 'next-intl'

import { searchOptions } from '../config/search-filters'
import type { SearchFilterTriggerProps } from '../types/search'
import { styles } from '../styles/search-filter-trigger.styles'

export function SearchFilterTrigger({ filterKey, value, onOpen }: SearchFilterTriggerProps) {
  const t = useTranslations('marketplace.home.search.filters')

  return (
    <Button
      fullWidth
      onClick={(event) => {
        event.stopPropagation()
        onOpen(filterKey)
      }}
      endIcon={<KeyboardArrowDownIcon sx={styles.keyboardArrowDownIcon} />}
      sx={styles.button}
    >
      <Box sx={styles.box}>
        <Typography sx={styles.typography}>{t(searchOptions[filterKey].labelKey)}</Typography>
        <Typography sx={styles.typography2}>{value}</Typography>
      </Box>
    </Button>
  )
}
