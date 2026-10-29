'use client'

import { useCrmFormatter } from '../../hooks/use-crm-formatter'

import * as crmStyles from '../../styles/opportunity-activities-panel.styles'

import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import { Avatar, Box, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { OpportunityActivitiesPanelProps } from '../../types/opportunity-detail'

export function OpportunityActivitiesPanel({
  activities,
  isLoading,
}: OpportunityActivitiesPanelProps) {
  const format = useCrmFormatter()
  const t = useTranslations('crm.opportunityDetail')
  return (
    <Box sx={crmStyles.boxSx}>
      <Paper component="section" elevation={0} sx={crmStyles.paperSx}>
        <Typography component="h2" sx={crmStyles.typographySx}>
          {t('activitiesTitle')}
        </Typography>
        <Box sx={crmStyles.boxSx2}>
          {isLoading ? (
            <CircularProgress size={24} />
          ) : activities.length > 0 ? (
            <Stack spacing={1.25}>
              {activities.map((activity) => (
                <Stack key={activity.key} direction="row" spacing={1.4} sx={crmStyles.stackSx}>
                  <Avatar sx={crmStyles.avatarSx}>
                    <HistoryRoundedIcon sx={crmStyles.historyRoundedIconSx} />
                  </Avatar>
                  <Box sx={crmStyles.boxSx3}>
                    <Stack direction="row" justifyContent="space-between" gap={1}>
                      <Typography sx={crmStyles.typographySx2}>{activity.title}</Typography>
                      <Chip
                        component="time"
                        dateTime={activity.occurredAt}
                        label={format.relative(activity.occurredAt)}
                        size="small"
                        variant="outlined"
                        sx={crmStyles.chipSx}
                      />
                    </Stack>
                    <Typography color="text.secondary" sx={crmStyles.typographySx3}>
                      {activity.detail}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Stack alignItems="center" justifyContent="center" spacing={1} sx={crmStyles.stackSx2}>
              <HistoryRoundedIcon sx={crmStyles.historyRoundedIconSx2} />
              <Typography sx={crmStyles.typographySx4}>{t('activitiesEmpty')}</Typography>
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  )
}
