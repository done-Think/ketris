import { Button, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { brand, radius, surface } from '@shared/theme/tokens'

import type { LeadsPaginationFooterProps } from '../../types/lead'

export function LeadsPaginationFooter({
  firstVisible,
  lastVisible,
  resultTotal,
  page,
  pageCount,
  onPageChange,
}: LeadsPaginationFooterProps) {
  const t = useTranslations('crm.leads')
  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1)

  return (
    <Stack
      component="footer"
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
      sx={{
        mt: 'auto',
        minHeight: 52,
        px: 2,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Typography color="text.secondary" sx={{ fontSize: 11.5 }}>
        {t('resultsRange', { first: firstVisible, last: lastVisible, total: resultTotal })}
      </Typography>
      <Stack direction="row" spacing={0.75}>
        {pageNumbers.map((pageNumber) => (
          <Button
            key={pageNumber}
            type="button"
            variant={pageNumber === page ? 'contained' : 'outlined'}
            aria-label={t('pagination.pageAriaLabel', { page: pageNumber })}
            aria-current={pageNumber === page ? 'page' : undefined}
            disabled={!onPageChange}
            onClick={() => onPageChange?.(pageNumber)}
            sx={{
              minWidth: 30,
              width: 30,
              height: 30,
              p: 0,
              borderRadius: `${radius.sm}px`,
              fontSize: 11.5,
              fontWeight: 700,
              ...(pageNumber !== page && {
                borderColor: brand.neutral[100],
                bgcolor: surface.paper,
                color: brand.neutral[500],
                '&:hover': { borderColor: brand.neutral[200], bgcolor: surface.paper },
              }),
            }}
          >
            {pageNumber}
          </Button>
        ))}
      </Stack>
    </Stack>
  )
}
