import { Button, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { brand, radius, surface } from '@shared/theme/tokens'

import type { ContactsPaginationFooterProps } from '../../types/contact'

export function ContactsPaginationFooter({
  firstVisible,
  lastVisible,
  resultTotal,
  page,
  canGoBack,
  canGoForward,
  onPageChange,
}: ContactsPaginationFooterProps) {
  const t = useTranslations('crm.contacts')

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
        {[
          {
            key: 'previous',
            label: t('pagination.previous'),
            disabled: !onPageChange || !canGoBack,
            onClick: () => onPageChange?.(page - 1),
          },
          {
            key: 'next',
            label: t('pagination.next'),
            disabled: !onPageChange || !canGoForward,
            onClick: () => onPageChange?.(page + 1),
          },
        ].map(({ key, label, disabled, onClick }) => (
          <Button
            key={key}
            type="button"
            variant="outlined"
            size="small"
            disabled={disabled}
            onClick={onClick}
            sx={{
              minWidth: 62,
              height: 24,
              px: 1,
              borderColor: brand.neutral[100],
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              color: brand.neutral[500],
              fontSize: 10.5,
              fontWeight: 500,
              '&:hover': { borderColor: brand.neutral[200], bgcolor: surface.paper },
              '&.Mui-disabled': {
                borderColor: brand.neutral[100],
                bgcolor: surface.paper,
                color: brand.neutral[500],
                opacity: 1,
              },
            }}
          >
            {label}
          </Button>
        ))}
      </Stack>
    </Stack>
  )
}
