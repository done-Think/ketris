import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, motion, radius, surface } from '@shared/theme/tokens'

import type {
  DashboardActivityAccent,
  UpcomingActivitiesPanelProps,
} from '../types/dashboard-overview'
import { DashboardPanel } from './DashboardPanel'

const activityAccentColor: Record<DashboardActivityAccent, string> = {
  magenta: brand.magenta[500],
  info: brand.semantic.info,
  warning: brand.semantic.warning,
}

export function UpcomingActivitiesPanel({
  activities,
  onActivitySelect,
}: UpcomingActivitiesPanelProps) {
  const t = useTranslations('dashboard.overview.upcomingActivities')

  return (
    <DashboardPanel>
      <Box sx={{ p: { xs: 2, md: 2.4 } }}>
        <Typography
          sx={{
            color: brand.neutral[500],
            fontSize: 11,
            fontWeight: 900,
            textTransform: 'uppercase',
          }}
        >
          {t('title')}
        </Typography>

        {activities.length === 0 ? (
          <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700, mt: 2 }}>
            {t('empty')}
          </Typography>
        ) : (
          <Stack spacing={1} sx={{ mt: 2 }}>
            {activities.map((activity) => (
              <Box
                component="button"
                key={activity.id}
                type="button"
                onClick={() => onActivitySelect(activity)}
                sx={{
                  display: 'block',
                  position: 'relative',
                  width: '100%',
                  border: 0,
                  textAlign: 'left',
                  overflow: 'hidden',
                  bgcolor: surface.app,
                  borderRadius: `${radius.sm}px`,
                  px: 1.5,
                  py: 1.1,
                  pl: 1.8,
                  cursor: 'pointer',
                  font: 'inherit',
                  transition: motion.transition.interactive,
                  '&:hover': {
                    bgcolor: alpha.magenta[6],
                    transform: 'translateY(-1px)',
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${brand.magenta[500]}`,
                    outlineOffset: 2,
                  },
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    insetBlock: 0,
                    left: 0,
                    width: 4,
                    bgcolor: activityAccentColor[activity.accent],
                  }}
                />
                <Typography
                  sx={{
                    color: activityAccentColor[activity.accent],
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {activity.time}
                </Typography>
                <Typography sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 900 }}>
                  {activity.title}
                </Typography>
                <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 600 }}>
                  {activity.contact}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </DashboardPanel>
  )
}
