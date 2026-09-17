'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { Box, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { DashboardNotificationsButton } from '@shared/components/layout'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import type { AgendaDashboardHeaderProps } from '../../types/agenda-event'

export function AgendaDashboardHeader({
  disableNextWeek,
  disablePreviousWeek,
  notifications,
  onNewEvent,
  onNextWeek,
  onNotificationSelect,
  onPreviousWeek,
  weekRange,
}: AgendaDashboardHeaderProps) {
  const t = useTranslations('agenda.dashboard')

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'flex-start', md: 'center' }}
      justifyContent="space-between"
      spacing={2}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h3"
          sx={{ color: brand.graphite[500], fontSize: { xs: 20, md: 24 }, fontWeight: 800 }}
        >
          {t('title')}
        </Typography>
        <Typography sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}>
          {t('subtitle')}
        </Typography>
      </Box>

      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ flexWrap: 'wrap' }}>
        <Tooltip title={t('previousWeek')}>
          <span>
            <IconButton
              aria-label={t('previousWeek')}
              disabled={disablePreviousWeek}
              onClick={onPreviousWeek}
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                width: 36,
                height: 36,
                border: '1px solid',
                borderColor: alpha.graphite[8],
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.paper,
              }}
            >
              <ChevronLeftRoundedIcon sx={{ fontSize: iconSize.sm }} />
            </IconButton>
          </span>
        </Tooltip>
        <Typography
          sx={{
            display: { xs: 'none', md: 'block' },
            color: brand.graphite[500],
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          {t('weekRange', { end: weekRange.endLabel, start: weekRange.startLabel })}
        </Typography>
        <Tooltip title={t('nextWeek')}>
          <span>
            <IconButton
              aria-label={t('nextWeek')}
              disabled={disableNextWeek}
              onClick={onNextWeek}
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                width: 36,
                height: 36,
                border: '1px solid',
                borderColor: alpha.graphite[8],
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.paper,
              }}
            >
              <ChevronRightRoundedIcon sx={{ fontSize: iconSize.sm }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t('newEvent')}>
          <IconButton
            aria-label={t('newEvent')}
            onClick={onNewEvent}
            sx={{
              display: { xs: 'inline-flex', md: 'none' },
              width: 44,
              height: 44,
              bgcolor: brand.magenta[500],
              color: surface.paper,
              '&:hover': { bgcolor: brand.magenta[600] },
            }}
          >
            <AddRoundedIcon sx={{ fontSize: iconSize.xl }} />
          </IconButton>
        </Tooltip>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon sx={{ fontSize: iconSize.lg }} />}
          onClick={onNewEvent}
          sx={{
            display: { xs: 'none', md: 'inline-flex' },
            borderRadius: `${radius.sm}px`,
            boxShadow: shadows.none,
            minHeight: 36,
            px: 2,
            fontSize: 14,
            fontWeight: 800,
            textTransform: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {t('newEvent')}
        </Button>
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <DashboardNotificationsButton
            notifications={notifications}
            onNotificationSelect={onNotificationSelect}
          />
        </Box>
      </Stack>
    </Stack>
  )
}
