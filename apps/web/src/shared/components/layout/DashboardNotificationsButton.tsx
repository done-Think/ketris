'use client'

import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import { Badge, Box, Divider, IconButton, Popover, Stack, Tooltip, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'
import type {
  DashboardNotificationItem,
  DashboardNotificationsButtonProps,
} from '@shared/types/dashboard-notification'

const notificationKindIcons = {
  todayVisit: EventAvailableRoundedIcon,
  assignedEvent: PersonAddAlt1RoundedIcon,
}

function useDefaultDashboardNotifications() {
  const t = useTranslations('dashboard.notificationsCenter.defaultItems')

  return useMemo<DashboardNotificationItem[]>(
    () => [
      {
        id: 'today-visit',
        kind: 'todayVisit',
        title: t('todayVisit.title'),
        message: t('todayVisit.message'),
      },
      {
        id: 'agency-assigned',
        kind: 'assignedEvent',
        title: t('agencyAssigned.title'),
        message: t('agencyAssigned.message'),
      },
      {
        id: 'broker-assigned',
        kind: 'assignedEvent',
        title: t('brokerAssigned.title'),
        message: t('brokerAssigned.message'),
      },
      {
        id: 'proposal-return',
        kind: 'todayVisit',
        title: t('proposalReturn.title'),
        message: t('proposalReturn.message'),
      },
    ],
    [t],
  )
}

export function DashboardNotificationsButton({
  notifications,
  onNotificationSelect,
}: DashboardNotificationsButtonProps) {
  const t = useTranslations('dashboard.notificationsCenter')
  const defaultNotifications = useDefaultDashboardNotifications()
  const notificationItems = notifications ?? defaultNotifications
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const isOpen = Boolean(anchorEl)

  const closeNotifications = () => setAnchorEl(null)

  const selectNotification = (notification: DashboardNotificationItem) => {
    onNotificationSelect?.(notification)
    closeNotifications()
  }

  return (
    <>
      <Tooltip title={t('tooltip')}>
        <IconButton
          aria-label={t('ariaLabel')}
          aria-expanded={isOpen ? 'true' : undefined}
          onClick={(event) => setAnchorEl(event.currentTarget)}
          sx={{
            width: 42,
            height: 42,
            border: '1px solid',
            borderColor: alpha.graphite[8],
            bgcolor: surface.paper,
            color: brand.graphite[500],
            boxShadow: shadows.crmCardCompact,
            '&:hover': { bgcolor: surface.paper },
          }}
        >
          <Badge
            badgeContent={notificationItems.length}
            overlap="circular"
            sx={{
              '& .MuiBadge-badge': {
                bgcolor: brand.magenta[500],
                color: surface.lightText,
                fontSize: 10,
                fontWeight: 900,
              },
            }}
          >
            <NotificationsNoneRoundedIcon sx={{ fontSize: iconSize.lg }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={closeNotifications}
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
          {notificationItems.length > 0 ? (
            notificationItems.map((notification) => {
              const Icon = notificationKindIcons[notification.kind]

              return (
                <Box
                  key={notification.id}
                  component="button"
                  type="button"
                  onClick={() => selectNotification(notification)}
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
                    cursor: onNotificationSelect ? 'pointer' : 'default',
                    textAlign: 'left',
                    '&:hover, &:focus-visible': {
                      bgcolor: onNotificationSelect ? alpha.magenta[6] : surface.paper,
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
    </>
  )
}
