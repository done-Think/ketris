import { Box, Paper, Stack, Typography } from '@mui/material'

import { DashboardTablePagination } from '@shared/components/layout'
import { alpha, dashboardLayout, radius, shadows, surface } from '@shared/theme/tokens'

import type { CrmListLayoutProps } from '../types/crm-list-layout'

const bodyFontFamily = 'var(--font-inter), system-ui, -apple-system, sans-serif'

export function CrmListLayout({
  header,
  filters,
  table,
  cards,
  isEmpty,
  emptyMessage,
  pagination,
}: CrmListLayoutProps) {
  return (
    <Box
      sx={{
        width: '100%',
        p: 3.5,
        bgcolor: surface.app,
        fontFamily: bodyFontFamily,
        '& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root, & .MuiTableCell-root': {
          fontFamily: bodyFontFamily,
        },
        '& h1.MuiTypography-root': {
          fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
        },
      }}
    >
      <Stack spacing={2}>
        {header}
        {filters}
        <Paper
          variant="outlined"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderColor: alpha.graphite[6],
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.paper,
            boxShadow: shadows.propertyCard,
          }}
        >
          {isEmpty ? (
            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 240, px: 2 }}>
              <Typography sx={{ color: 'text.secondary', fontSize: 12.5 }}>
                {emptyMessage}
              </Typography>
            </Stack>
          ) : (
            <>
              <Box
                sx={{
                  display: { xs: 'none' },
                  [dashboardLayout.desktopMediaQuery]: { display: 'block' },
                }}
              >
                {table}
              </Box>
              <Box
                sx={{
                  display: { xs: 'block' },
                  [dashboardLayout.desktopMediaQuery]: { display: 'none' },
                }}
              >
                {cards}
              </Box>
            </>
          )}
          <DashboardTablePagination {...pagination} />
        </Paper>
      </Stack>
    </Box>
  )
}
