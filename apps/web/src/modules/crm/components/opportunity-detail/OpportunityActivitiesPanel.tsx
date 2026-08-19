import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import { Avatar, Box, Paper, Stack, Typography } from '@mui/material'

import { brand, iconSize, surface } from '@shared/theme/tokens'

import type { OpportunityActivitiesPanelProps } from '../../types/opportunity-detail'
import { formatRelativeDate } from '../../utils/formatters'
import { panelSx } from './opportunity-detail.styles'

export function OpportunityActivitiesPanel({ activities }: OpportunityActivitiesPanelProps) {
  return (
    <Paper component="section" elevation={0} sx={{ ...panelSx, p: { xs: 2, md: 2.5 } }}>
      <Typography component="h2" sx={{ mb: 2, fontSize: 16, fontWeight: 800 }}>
        Atividades recentes
      </Typography>
      <Stack>
        {activities.map((activity, index) => (
          <Stack key={activity.key} direction="row" spacing={1.4}>
            <Stack alignItems="center">
              <Avatar
                sx={{
                  width: 31,
                  height: 31,
                  bgcolor: surface.app,
                  color: brand.neutral[500],
                }}
              >
                <HistoryRoundedIcon sx={{ fontSize: iconSize.sm }} />
              </Avatar>
              {index < activities.length - 1 && (
                <Box sx={{ width: 1, minHeight: 48, flex: 1, bgcolor: 'divider' }} />
              )}
            </Stack>
            <Box sx={{ minWidth: 0, flex: 1, pb: index < activities.length - 1 ? 2 : 0 }}>
              <Stack direction="row" justifyContent="space-between" gap={1}>
                <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{activity.title}</Typography>
                <Typography
                  component="time"
                  dateTime={activity.occurredAt}
                  color="text.disabled"
                  sx={{ flexShrink: 0, fontSize: 10 }}
                >
                  {formatRelativeDate(activity.occurredAt)}
                </Typography>
              </Stack>
              <Typography color="text.secondary" sx={{ mt: 0.25, fontSize: 11.5 }}>
                {activity.detail}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Paper>
  )
}
