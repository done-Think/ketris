'use client'

import { styles } from '@shared/styles/dashboard-notifications-button.styles'

import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import { Badge, Box, Divider, IconButton, Popover, Stack, Tooltip, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { useRouter } from '@/i18n/navigation'
import { useDashboardAgendaNotifications } from '@shared/hooks/use-dashboard-agenda-notifications'

import type {
  DashboardNotificationItem,
  DashboardNotificationsButtonProps,
} from '@shared/types/dashboard-notification'

const notificationKindIcons = {
  todayVisit: EventAvailableRoundedIcon,
  assignedEvent: PersonAddAlt1RoundedIcon,
}

export function DashboardNotificationsButton({
  placement = 'pageHeader',
  notifications,
  onNotificationSelect,
}: DashboardNotificationsButtonProps) {
  const router = useRouter()
  const t = useTranslations('dashboard.notificationsCenter')
  const agendaNotifications = useDashboardAgendaNotifications()
  const notificationItems = notifications ?? agendaNotifications
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const isOpen = Boolean(anchorEl)

  const closeNotifications = () => setAnchorEl(null)

  const selectNotification = (notification: DashboardNotificationItem) => {
    if (onNotificationSelect) {
      onNotificationSelect(notification)
    } else if (notification.href) {
      router.push(notification.href)
    }

    closeNotifications()
  }

  const hasNotificationAction = (notification: DashboardNotificationItem) =>
    Boolean(onNotificationSelect || notification.href)

  return (
    <>
      <Tooltip title={t('tooltip')}>
        <IconButton
          aria-label={t('ariaLabel')}
          aria-expanded={isOpen ? 'true' : undefined}
          onClick={(event) => setAnchorEl(event.currentTarget)}
          sx={styles.iconButton(placement)}
        >
          <Badge badgeContent={notificationItems.length} overlap="circular" sx={styles.badge}>
            <NotificationsNoneRoundedIcon sx={styles.notificationsNoneRoundedIcon} />
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
            sx: styles.paper,
          },
        }}
      >
        <Box sx={styles.box}>
          <Typography sx={styles.typography}>{t('title')}</Typography>
          <Typography sx={styles.typography2}>{t('subtitle')}</Typography>
        </Box>
        <Divider sx={styles.divider} />
        <Stack sx={styles.stack}>
          {notificationItems.length > 0 ? (
            notificationItems.map((notification) => {
              const Icon = notificationKindIcons[notification.kind]

              return (
                <Box
                  key={notification.id}
                  component="button"
                  type="button"
                  onClick={() => selectNotification(notification)}
                  sx={styles.box2(hasNotificationAction(notification))}
                >
                  <Box sx={styles.box3}>
                    <Icon sx={styles.icon} />
                  </Box>
                  <Box sx={styles.box4}>
                    <Typography noWrap sx={styles.typography3}>
                      {notification.title}
                    </Typography>
                    <Typography sx={styles.typography4}>{notification.message}</Typography>
                  </Box>
                </Box>
              )
            })
          ) : (
            <Box sx={styles.box5}>
              <Typography sx={styles.typography5}>{t('empty')}</Typography>
            </Box>
          )}
        </Stack>
      </Popover>
    </>
  )
}
