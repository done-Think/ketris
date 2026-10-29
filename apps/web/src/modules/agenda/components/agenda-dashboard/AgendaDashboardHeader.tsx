'use client'

import { styles } from '../../styles/agenda-dashboard-header.styles'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import {
  DashboardHeaderActionButton,
  DashboardNotificationsButton,
  DashboardPageHeader,
} from '@shared/components/layout'

import type { AgendaDashboardHeaderProps } from '../../types/agenda-event'

export function AgendaDashboardHeader({
  readOnly = false,
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

  const actions = (
    <Stack direction="row" alignItems="center" spacing={1.2} sx={styles.stack}>
      <Tooltip title={t('previousWeek')}>
        <span>
          <IconButton
            aria-label={t('previousWeek')}
            disabled={disablePreviousWeek}
            onClick={onPreviousWeek}
            sx={styles.iconButton}
          >
            <ChevronLeftRoundedIcon sx={styles.chevronLeftRoundedIcon} />
          </IconButton>
        </span>
      </Tooltip>
      <Typography sx={styles.typography}>
        {t('weekRange', { end: weekRange.endLabel, start: weekRange.startLabel })}
      </Typography>
      <Tooltip title={t('nextWeek')}>
        <span>
          <IconButton
            aria-label={t('nextWeek')}
            disabled={disableNextWeek}
            onClick={onNextWeek}
            sx={styles.iconButton2}
          >
            <ChevronRightRoundedIcon sx={styles.chevronRightRoundedIcon} />
          </IconButton>
        </span>
      </Tooltip>
      {!readOnly && (
        <>
          <Tooltip title={t('newEvent')}>
            <IconButton aria-label={t('newEvent')} onClick={onNewEvent} sx={styles.iconButton3}>
              <AddRoundedIcon sx={styles.addRoundedIcon} />
            </IconButton>
          </Tooltip>
          <DashboardHeaderActionButton
            startIcon={<AddRoundedIcon sx={styles.addRoundedIcon2} />}
            onClick={onNewEvent}
            sx={styles.dashboardHeaderActionButton}
          >
            {t('newEvent')}
          </DashboardHeaderActionButton>
        </>
      )}
      <Box sx={styles.box}>
        <DashboardNotificationsButton
          notifications={notifications}
          onNotificationSelect={onNotificationSelect}
        />
      </Box>
    </Stack>
  )

  return <DashboardPageHeader title={t('title')} subtitle={t('subtitle')} actions={actions} />
}
