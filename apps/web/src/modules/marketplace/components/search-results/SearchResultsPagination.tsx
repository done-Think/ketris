'use client'

import { Button, IconButton, Stack } from '@mui/material'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'
import { useTranslations } from 'next-intl'
import type { SearchResultsPaginationProps } from '../../types/search'
import { styles, getButtonStyles } from '../../styles/search-results-pagination.styles'

export function SearchResultsPagination({
  currentPage,
  setCurrentPage,
  totalPages,
}: SearchResultsPaginationProps) {
  const t = useTranslations('marketplace.searchResults.filters')
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={1}
      sx={styles.stack}
    >
      <IconButton aria-label={t('button')} sx={styles.iconButton}>
        <FilterListRoundedIcon sx={styles.filterListRoundedIcon} />
      </IconButton>
      {pages.map((page) => {
        const active = page === currentPage

        return (
          <Button
            key={page}
            aria-current={active ? 'page' : undefined}
            onClick={() => setCurrentPage(page)}
            size="small"
            sx={getButtonStyles({ active })}
          >
            {page}
          </Button>
        )
      })}
    </Stack>
  )
}
