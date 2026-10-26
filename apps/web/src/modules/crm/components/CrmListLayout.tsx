import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import * as crmStyles from '../styles/crm-list-layout.styles'

import { DashboardTablePagination } from '@shared/components/layout'

import { useTranslations } from 'next-intl'

import type { CrmListLayoutProps } from '../types/crm-list-layout'

export function CrmListLayout({
  embedded = false,
  header,
  filters,
  table,
  cards,
  isEmpty,
  emptyMessage,
  pagination,
  isLoading,
  error,
  onRetry,
}: CrmListLayoutProps) {
  const t = useTranslations('crm.pipeline')
  return (
    <Box sx={embedded ? crmStyles.embeddedBoxSx : crmStyles.boxSx}>
      <Stack spacing={2}>
        {header}
        {error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={onRetry}>
                {t('retry')}
              </Button>
            }
          >
            {t('dataLoadError')}
          </Alert>
        )}
        {filters}
        <Paper variant="outlined" sx={crmStyles.paperSx}>
          {isLoading ? (
            <Stack alignItems="center" justifyContent="center" sx={crmStyles.stackSx}>
              <CircularProgress size={28} />
            </Stack>
          ) : isEmpty ? (
            <Stack alignItems="center" justifyContent="center" sx={crmStyles.stackSx2}>
              <Typography sx={crmStyles.typographySx}>{emptyMessage}</Typography>
            </Stack>
          ) : (
            <>
              <Box sx={crmStyles.boxSx2}>{table}</Box>
              <Box sx={crmStyles.boxSx3}>{cards}</Box>
            </>
          )}
          <DashboardTablePagination {...pagination} />
        </Paper>
      </Stack>
    </Box>
  )
}
