'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import { Badge, Box, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import type { AgendaDashboardHeaderProps } from '../../types/agenda-event'

export function AgendaDashboardHeader({
  disableNextWeek,
  disablePreviousWeek,
  notificationCount,
  notificationsExpanded,
  onNewEvent,
  onNextWeek,
  onOpenNotifications,
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
      sx={{ width: '100%' }}
    >
      <Box sx={{ minWidth: 0, width: { xs: '100%', md: 'auto' } }}>
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

      <Stack
        direction="row"
        alignItems="center"
        spacing={1.2}
        sx={{
          flexWrap: 'wrap',
          width: { xs: '100%', md: 'auto' },
        }}
      >
        <Tooltip title={t('previousWeek')}>
          <Box component="span">
            <IconButton
              aria-label={t('previousWeek')}
              disabled={disablePreviousWeek}
              onClick={onPreviousWeek}
              sx={{
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
          </Box>
        </Tooltip>
        <Typography
          sx={{
            color: brand.graphite[500],
            flex: { xs: 1, md: 'initial' },
            fontSize: 14,
            fontWeight: 800,
            minWidth: 0,
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          {t('weekRange', { end: weekRange.endLabel, start: weekRange.startLabel })}
        </Typography>
        <Tooltip title={t('nextWeek')}>
          <Box component="span">
            <IconButton
              aria-label={t('nextWeek')}
              disabled={disableNextWeek}
              onClick={onNextWeek}
              sx={{
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
          </Box>
        </Tooltip>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon sx={{ fontSize: iconSize.lg }} />}
          onClick={onNewEvent}
          sx={{
            borderRadius: `${radius.sm}px`,
            boxShadow: shadows.none,
            flex: { xs: '1 1 calc(100% - 48px)', md: 'initial' },
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
        <Tooltip title={t('notificationsTooltip')}>
          <IconButton
            aria-label={t('notificationsAriaLabel')}
            aria-expanded={notificationsExpanded ? 'true' : undefined}
            onClick={(event) => onOpenNotifications(event.currentTarget)}
            sx={{
              display: { xs: 'none', md: 'inline-flex' },
              width: 36,
              height: 36,
              border: '1px solid',
              borderColor: alpha.graphite[8],
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              color: brand.graphite[500],
            }}
          >
            <Badge
              badgeContent={notificationCount}
              overlap="circular"
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: brand.magenta[500],
                  color: surface.lightText,
                  fontSize: 10,
                  fontWeight: 800,
                },
              }}
            >
              <NotificationsNoneRoundedIcon sx={{ fontSize: iconSize.md }} />
            </Badge>
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  )
}
