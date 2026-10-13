'use client'

import { Button, IconButton, Stack } from '@mui/material'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'
import { useTranslations } from 'next-intl'

import { alpha, componentText, iconSize, radius, surface } from '@shared/theme/tokens'
import type { SearchResultsPaginationProps } from '../../types/search'

export function SearchResultsPagination({
  currentPage,
  setCurrentPage,
  totalPages,
}: SearchResultsPaginationProps) {
  const t = useTranslations('marketplace.searchResults.filters')
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mt: 2.4 }}>
      <IconButton
        aria-label={t('button')}
        sx={{
          display: { xs: 'inline-flex', lg: 'none' },
          width: 38,
          height: 38,
          borderRadius: radius.full,
          bgcolor: surface.paper,
          boxShadow: `0 8px 20px ${alpha.graphite[8]}`,
        }}
      >
        <FilterListRoundedIcon sx={{ fontSize: iconSize.md }} />
      </IconButton>
      {pages.map((page) => {
        const active = page === currentPage

        return (
          <Button
            key={page}
            aria-current={active ? 'page' : undefined}
            onClick={() => setCurrentPage(page)}
            size="small"
            sx={{
              minWidth: 34,
              width: 34,
              height: 34,
              borderRadius: radius.full,
              color: active ? surface.lightText : 'text.secondary',
              bgcolor: active ? 'primary.main' : 'transparent',
              ...componentText.resetButtonText,
              '&:hover': {
                bgcolor: active ? 'primary.dark' : alpha.magenta[6],
              },
            }}
          >
            {page}
          </Button>
        )
      })}
    </Stack>
  )
}
