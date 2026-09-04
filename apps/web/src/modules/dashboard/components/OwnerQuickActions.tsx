import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { Box, Paper, Stack, Typography } from '@mui/material'
import NextLink from 'next/link'

import { alpha, brand, iconSize, motion, radius, surface } from '@shared/theme/tokens'

import { ownerQuickActions } from '../fixtures/owner-dashboard-fixtures'
import type { OwnerQuickActionId } from '../types/owner-dashboard'

const quickActionIcons: Record<OwnerQuickActionId, typeof AddCircleOutlineRoundedIcon> = {
  'list-property': AddCircleOutlineRoundedIcon,
  'generate-report': DescriptionOutlinedIcon,
  'configure-alerts': SettingsOutlinedIcon,
  support: InfoOutlinedIcon,
}

export function OwnerQuickActions() {
  return (
    <Box component="section" aria-labelledby="quick-actions-title">
      <Typography
        id="quick-actions-title"
        component="h2"
        sx={{
          color: brand.neutral[600],
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.025em',
          textTransform: 'uppercase',
        }}
      >
        Atalhos Rápidos
      </Typography>

      <Box
        role="group"
        aria-label="Atalhos rápidos do proprietário"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, 1fr)' },
          gap: { xs: 1.5, md: 2 },
          mt: 1.5,
        }}
      >
        {ownerQuickActions.map((action) => {
          const Icon = quickActionIcons[action.id]

          return (
            <Paper
              key={action.id}
              component={NextLink}
              href={action.href}
              elevation={0}
              sx={{
                display: 'flex',
                alignItems: 'center',
                minWidth: 0,
                minHeight: { xs: 72, md: 78 },
                border: '1px solid',
                borderColor: brand.neutral[100],
                borderRadius: `${radius.md}px`,
                bgcolor: surface.paper,
                color: brand.graphite[500],
                px: { xs: 1.5, md: 2 },
                textDecoration: 'none',
                transition: motion.transition.card,
                '&:hover': {
                  borderColor: alpha.magenta[36],
                  boxShadow: `0 8px 20px ${alpha.graphite[6]}`,
                  transform: 'translateY(-1px)',
                },
                '&:focus-visible': {
                  outline: `2px solid ${brand.magenta[500]}`,
                  outlineOffset: 2,
                },
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={{ xs: 1.2, md: 1.7 }}
                sx={{ minWidth: 0 }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 38,
                    height: 38,
                    flexShrink: 0,
                    borderRadius: `${radius.sm}px`,
                    bgcolor: surface.app,
                    color: brand.graphite[500],
                  }}
                >
                  <Icon sx={{ fontSize: iconSize.lg }} />
                </Box>
                <Typography
                  sx={{
                    fontSize: { xs: 11.5, md: 12.5 },
                    fontWeight: 700,
                    lineHeight: 1.25,
                  }}
                >
                  {action.label}
                </Typography>
              </Stack>
            </Paper>
          )
        })}
      </Box>
    </Box>
  )
}
