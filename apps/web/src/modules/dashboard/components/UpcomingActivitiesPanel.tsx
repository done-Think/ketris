import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { DashboardPanel } from '@shared/components/ui/DashboardPanel'

import type { UpcomingActivitiesPanelProps } from '../types/dashboard-overview'
import {
  getAccentBarStyles,
  getAccentTimeStyles,
  styles,
} from '../styles/upcoming-activities-panel.styles'

export function UpcomingActivitiesPanel({
  activities,
  onActivitySelect,
}: UpcomingActivitiesPanelProps) {
  const t = useTranslations('dashboard.overview.upcomingActivities')

  return (
    <DashboardPanel>
      <Box sx={styles.box}>
        <Typography sx={styles.typography}>{t('title')}</Typography>

        {activities.length === 0 ? (
          <Typography sx={styles.typography2}>{t('empty')}</Typography>
        ) : (
          <Stack spacing={1} sx={styles.stack}>
            {activities.map((activity) => (
              <Box
                component="button"
                key={activity.id}
                type="button"
                onClick={() => onActivitySelect(activity)}
                sx={styles.box2}
              >
                <Box sx={getAccentBarStyles(activity.accent)} />
                <Typography sx={getAccentTimeStyles(activity.accent)}>{activity.time}</Typography>
                <Typography sx={styles.typography3}>{activity.title}</Typography>
                <Typography sx={styles.typography4}>{activity.contact}</Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </DashboardPanel>
  )
}
