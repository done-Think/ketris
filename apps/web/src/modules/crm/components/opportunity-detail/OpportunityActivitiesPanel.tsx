'use client'

import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import { Avatar, Box, Chip, Paper, Stack, Typography } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'

import { brand, iconSize, radius, surface } from '@shared/theme/tokens'

import type { OpportunityActivitiesPanelProps } from '../../types/opportunity-detail'
import { formatRelativeDate } from '../../utils/formatters'
import { panelSx } from './opportunity-detail.styles'

export function OpportunityActivitiesPanel({ activities }: OpportunityActivitiesPanelProps) {
  const locale = useLocale() as AppLocale
  const t = useTranslations('crm.opportunityDetail')
  return (
    <Box sx={{ position: 'relative', minHeight: 148, height: { lg: '100%' } }}>
      <Paper
        component="section"
        elevation={0}
        sx={{
          ...panelSx,
          position: { xs: 'relative', lg: 'absolute' },
          inset: { lg: 0 },
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          p: { xs: 2, md: 2.5 },
        }}
      >
        <Typography
          component="h2"
          sx={{ mb: 1.35, fontSize: 16, fontWeight: 800, textAlign: 'center' }}
        >
          {t('activitiesTitle')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            minHeight: 0,
            flex: 1,
            flexDirection: 'column',
            p: 1,
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.app,
            overflowY: 'auto',
            scrollbarWidth: 'thin',
          }}
        >
          {activities.length > 0 ? (
            <Stack spacing={1.25}>
              {activities.map((activity) => (
                <Stack
                  key={activity.key}
                  direction="row"
                  spacing={1.4}
                  sx={{
                    px: 1.45,
                    py: 1.55,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: `${radius.sm}px`,
                    bgcolor: surface.paper,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 34,
                      height: 34,
                      flexShrink: 0,
                      bgcolor: surface.app,
                      color: brand.neutral[500],
                    }}
                  >
                    <HistoryRoundedIcon sx={{ fontSize: iconSize.sm }} />
                  </Avatar>
                  <Box
                    sx={{
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" gap={1}>
                      <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                        {activity.title}
                      </Typography>
                      <Chip
                        component="time"
                        dateTime={activity.occurredAt}
                        label={formatRelativeDate(activity.occurredAt, new Date(), locale)}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, flexShrink: 0, fontSize: 11, fontWeight: 700 }}
                      />
                    </Stack>
                    <Typography color="text.secondary" sx={{ mt: 0.25, fontSize: 11.5 }}>
                      {activity.detail}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={1}
              sx={{
                minHeight: 86,
                p: 2,
                borderRadius: `${radius.sm}px`,
              }}
            >
              <HistoryRoundedIcon sx={{ color: 'text.disabled' }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{t('activitiesEmpty')}</Typography>
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  )
}
