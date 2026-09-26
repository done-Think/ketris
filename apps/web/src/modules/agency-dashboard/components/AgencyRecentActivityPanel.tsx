'use client'

import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined'
import { Box, ButtonBase, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { DashboardPanel } from '@modules/dashboard/components/DashboardPanel'
import { alpha, brand, iconSize, motion, radius } from '@shared/theme/tokens'

import { agencyRecentActivities } from '../data/agency-overview'
import type { AgencyActivity, AgencyActivityTone } from '../types/agency-overview'
import { AgencyActivityDetailDialog } from './AgencyActivityDetailDialog'

const activityIcon = {
  contract: DescriptionOutlinedIcon,
  property: HomeWorkOutlinedIcon,
  visit: CalendarTodayOutlinedIcon,
  lead: PersonAddAlt1OutlinedIcon,
} satisfies Record<AgencyActivityTone, typeof DescriptionOutlinedIcon>

export function AgencyRecentActivityPanel() {
  const t = useTranslations('dashboard.agencyOverview.activity')
  const [selectedActivity, setSelectedActivity] = useState<AgencyActivity | null>(null)

  return (
    <>
      <DashboardPanel>
        <Box sx={{ p: { xs: 2, md: 2.4 } }}>
          <Typography sx={{ mb: 1.6, color: brand.graphite[500], fontSize: 15, fontWeight: 900 }}>
            {t('title')}
          </Typography>

          <Stack>
            {agencyRecentActivities.map((activity) => {
              const Icon = activityIcon[activity.tone]

              return (
                <ButtonBase
                  key={activity.id}
                  onClick={() => setSelectedActivity(activity)}
                  sx={{
                    display: 'block',
                    width: '100%',
                    borderBottom: '1px solid',
                    borderColor: alpha.graphite[6],
                    borderRadius: `${radius.sm}px`,
                    textAlign: 'left',
                    transition: motion.transition.interactive,
                    '&:hover': {
                      bgcolor: alpha.magenta[6],
                    },
                    '&:last-child': { borderBottom: 0 },
                    '&.Mui-focusVisible': {
                      boxShadow: `0 0 0 2px ${alpha.magenta[14]}`,
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.2}
                    sx={{
                      alignItems: 'center',
                      px: 0.8,
                      py: 1.2,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'grid',
                        width: 28,
                        height: 28,
                        flexShrink: 0,
                        placeItems: 'center',
                        borderRadius: '50%',
                        bgcolor: alpha.magenta[8],
                        color: brand.magenta[600],
                      }}
                    >
                      <Icon sx={{ fontSize: iconSize.xs }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{ color: brand.graphite[500], fontSize: 12.5, fontWeight: 900 }}
                      >
                        {t(activity.actionKey, {
                          broker: activity.broker,
                          detail: activity.detail,
                        })}
                      </Typography>
                      <Typography
                        sx={{ color: brand.neutral[400], fontSize: 10.5, fontWeight: 700 }}
                      >
                        {activity.timeAgo}
                      </Typography>
                    </Box>
                  </Stack>
                </ButtonBase>
              )
            })}
          </Stack>
        </Box>
      </DashboardPanel>

      <AgencyActivityDetailDialog
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </>
  )
}
