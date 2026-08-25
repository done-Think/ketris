import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { IconButton, Stack, Typography } from '@mui/material'

import { brand, iconSize, radius, surface } from '@shared/theme/tokens'

import type { ProposalPaginationProps } from '../../types/proposal-management'

function getVisiblePageNumbers(page: number, pageCount: number) {
  const maximumVisiblePages = 4
  const firstPage = Math.min(
    Math.max(1, page - 1),
    Math.max(1, pageCount - maximumVisiblePages + 1),
  )
  const visiblePageCount = Math.min(maximumVisiblePages, pageCount)

  return Array.from({ length: visiblePageCount }, (_, index) => firstPage + index)
}

export function ProposalPagination({
  page,
  pageCount,
  visibleCount,
  totalCount,
  onPageChange,
}: ProposalPaginationProps) {
  const visiblePages = getVisiblePageNumbers(page, pageCount)
  const canGoBack = page > 1
  const canGoForward = page < pageCount

  const navigationButtonSx = {
    width: 30,
    height: 30,
    bgcolor: surface.app,
    color: brand.neutral[500],
    '&:hover': { bgcolor: brand.neutral[50], color: brand.graphite[500] },
    '&.Mui-disabled': {
      bgcolor: surface.app,
      color: brand.neutral[300],
      opacity: 1,
    },
  } as const

  return (
    <Stack
      component="footer"
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
      gap={1.5}
      sx={{
        mt: 'auto',
        minHeight: 58,
        px: 2,
        py: { xs: 1.5, sm: 0 },
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: surface.app,
      }}
    >
      <Typography color="text.secondary" sx={{ fontSize: 11.5 }}>
        Exibindo {visibleCount} de {totalCount} propostas
      </Typography>

      <Stack direction="row" alignItems="center" spacing={0.5}>
        <IconButton
          type="button"
          aria-label="Página anterior"
          disabled={!onPageChange || !canGoBack}
          onClick={() => onPageChange?.(page - 1)}
          sx={navigationButtonSx}
        >
          <ChevronLeftRoundedIcon sx={{ fontSize: iconSize.md }} />
        </IconButton>

        {visiblePages.map((pageNumber) => {
          const active = pageNumber === page

          return (
            <IconButton
              key={pageNumber}
              type="button"
              aria-label={`Ir para página ${pageNumber}`}
              aria-current={active ? 'page' : undefined}
              disabled={!onPageChange}
              onClick={() => onPageChange?.(pageNumber)}
              sx={{
                width: 30,
                height: 30,
                borderRadius: `${radius.full}px`,
                bgcolor: active ? brand.magenta[500] : 'transparent',
                color: active ? surface.lightText : brand.graphite[500],
                fontSize: 11.5,
                fontWeight: active ? 800 : 600,
                '&:hover': {
                  bgcolor: active ? brand.magenta[600] : brand.neutral[50],
                },
                '&.Mui-disabled': {
                  bgcolor: active ? brand.magenta[500] : 'transparent',
                  color: active ? surface.lightText : brand.graphite[500],
                  opacity: 1,
                },
              }}
            >
              {pageNumber}
            </IconButton>
          )
        })}

        <IconButton
          type="button"
          aria-label="Próxima página"
          disabled={!onPageChange || !canGoForward}
          onClick={() => onPageChange?.(page + 1)}
          sx={navigationButtonSx}
        >
          <ChevronRightRoundedIcon sx={{ fontSize: iconSize.md }} />
        </IconButton>
      </Stack>
    </Stack>
  )
}
