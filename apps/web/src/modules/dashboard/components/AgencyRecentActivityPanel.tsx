'use client'

import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined'
import { Box, ButtonBase, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { DashboardPanel } from '@shared/components/ui/DashboardPanel'

import type {
  AgencyActivity,
  AgencyActivityTone,
  AgencyRecentActivityPanelProps,
} from '../types/agency-overview'
import { AgencyActivityDetailDialog } from './AgencyActivityDetailDialog'
import { styles } from '../styles/agency-recent-activity-panel.styles'

const activityIcon = {
  contract: DescriptionOutlinedIcon,
  property: HomeWorkOutlinedIcon,
  visit: CalendarTodayOutlinedIcon,
  lead: PersonAddAlt1OutlinedIcon,
} satisfies Record<AgencyActivityTone, typeof DescriptionOutlinedIcon>

export function AgencyRecentActivityPanel({ activities }: AgencyRecentActivityPanelProps) {
  const t = useTranslations('dashboard.agencyOverview.activity')
  const [selectedActivity, setSelectedActivity] = useState<AgencyActivity | null>(null)

  return (
    <>
      <DashboardPanel>
        <Box sx={styles.box}>
          <Typography sx={styles.typography}>{t('title')}</Typography>

          <Stack>
            {activities.map((activity) => {
              const Icon = activityIcon[activity.tone]

              return (
                <ButtonBase
                  key={activity.id}
                  onClick={() => setSelectedActivity(activity)}
                  sx={styles.buttonBase}
                >
                  <Stack direction="row" spacing={1.2} sx={styles.stack}>
                    <Box sx={styles.box2}>
                      <Icon sx={styles.icon} />
                    </Box>
                    <Box sx={styles.box3}>
                      <Typography sx={styles.typography2}>
                        {activity.broker
                          ? t(`messages.${activity.tone}`, {
                              broker: activity.broker,
                              detail: activity.detail,
                            })
                          : t(`messagesNoBroker.${activity.tone}`, { detail: activity.detail })}
                      </Typography>
                      <Typography sx={styles.typography3}>{activity.occurredAtLabel}</Typography>
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
