'use client'

import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import { Box, Divider, Popover, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import type { AgendaNotificationsPopoverProps } from '../../types/agenda-event'

export function AgendaNotificationsPopover({
  anchorEl,
  notifications,
  onClose,
  onSelectNotification,
}: AgendaNotificationsPopoverProps) {
  const t = useTranslations('agenda.dashboard.notifications')

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      slotProps={{
        paper: {
          sx: {
            width: { xs: 312, sm: 360 },
            maxWidth: 'calc(100vw - 32px)',
            mt: 1,
            border: '1px solid',
            borderColor: alpha.graphite[8],
            borderRadius: `${radius.sm}px`,
            boxShadow: shadows.crmCardHover,
          },
        },
      }}
    >
      <Box sx={{ p: 1.6 }}>
        <Typography sx={{ color: brand.graphite[500], fontSize: 15, fontWeight: 900 }}>
          {t('title')}
        </Typography>
        <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
          {t('subtitle')}
        </Typography>
      </Box>
      <Divider sx={{ borderColor: alpha.graphite[8] }} />
      <Stack sx={{ maxHeight: 360, overflowY: 'auto', p: 0.8 }}>
        {notifications.length > 0 ? (
          notifications.map((notification) => {
            const Icon =
              notification.kind === 'todayVisit'
                ? EventAvailableRoundedIcon
                : PersonAddAlt1RoundedIcon

            return (
              <Box
                key={notification.id}
                component="button"
                type="button"
                onClick={() => onSelectNotification(notification.event)}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr',
                  gap: 1,
                  width: '100%',
                  border: 0,
                  borderRadius: `${radius.sm}px`,
                  bgcolor: surface.paper,
                  px: 1,
                  py: 1.1,
                  cursor: 'pointer',
                  textAlign: 'left',
                  '&:hover, &:focus-visible': {
                    bgcolor: alpha.magenta[6],
                    outline: 'none',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: radius.full,
                    bgcolor: alpha.magenta[10],
                    color: brand.magenta[600],
                  }}
                >
                  <Icon sx={{ fontSize: iconSize.md }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    noWrap
                    sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 900 }}
                  >
                    {notification.title}
                  </Typography>
                  <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
                    {notification.message}
                  </Typography>
                </Box>
              </Box>
            )
          })
        ) : (
          <Box sx={{ px: 1, py: 2.2 }}>
            <Typography sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}>
              {t('empty')}
            </Typography>
          </Box>
        )}
      </Stack>
    </Popover>
  )
}
