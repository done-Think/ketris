'use client'

import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { Avatar, Box, Chip, Paper, Stack, Typography } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'
import { useState } from 'react'

import { brand, iconSize, radius, supportColor, surface } from '@shared/theme/tokens'

import type {
  OpportunityNextAction,
  OpportunityNextActionsPanelProps,
} from '../../types/opportunity-detail'
import { formatRelativeDate } from '../../utils/formatters'
import { panelSx } from './opportunity-detail.styles'

const toneConfig = {
  info: {
    color: brand.semantic.info,
    softColor: supportColor.infoSoft,
    icon: ScheduleRoundedIcon,
  },
  warning: {
    color: brand.semantic.warning,
    softColor: supportColor.warningSoft,
    icon: WarningAmberRoundedIcon,
  },
  success: {
    color: brand.semantic.success,
    softColor: supportColor.successSoft,
    icon: CheckCircleOutlineRoundedIcon,
  },
} as const

function OpportunityNextActionItem({
  action,
  expanded,
  onToggle,
}: {
  action: OpportunityNextAction
  expanded: boolean
  onToggle: () => void
}) {
  const locale = useLocale() as AppLocale
  const t = useTranslations('crm.opportunityDetail')
  const tone = toneConfig[action.tone]
  const Icon = tone.icon

  return (
    <Stack
      component="button"
      type="button"
      direction="row"
      spacing={1.5}
      onClick={onToggle}
      sx={{
        width: '100%',
        px: 1.45,
        py: 1.55,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: `${radius.sm}px`,
        bgcolor: surface.paper,
        cursor: 'pointer',
        font: 'inherit',
        textAlign: 'left',
        '&:hover': {
          borderColor: 'divider',
        },
        '&:focus': {
          outline: 'none',
        },
        '&:focus-visible': {
          outline: 'none',
        },
      }}
    >
      <Avatar
        sx={{
          width: 34,
          height: 34,
          flexShrink: 0,
          bgcolor: tone.softColor,
          color: tone.color,
        }}
      >
        <Icon sx={{ fontSize: iconSize.sm }} />
      </Avatar>
      <Box minWidth={0} flex={1}>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          gap={1}
          minWidth={0}
        >
          <Typography
            sx={{
              minWidth: 0,
              overflow: 'hidden',
              fontSize: 13.5,
              fontWeight: 800,
              lineHeight: 1.35,
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {action.title}
          </Typography>
          <Chip
            component="time"
            dateTime={action.dueAt}
            label={formatRelativeDate(action.dueAt, new Date(), locale)}
            size="small"
            variant="outlined"
            aria-label={t('nextActions.dueAt')}
            sx={{ height: 22, flexShrink: 0, fontSize: 11, fontWeight: 700 }}
          />
        </Stack>
        <Typography
          color="text.secondary"
          sx={{
            mt: 0.55,
            overflow: expanded ? 'visible' : 'hidden',
            fontSize: 11.8,
            lineHeight: 1.5,
            textOverflow: expanded ? 'clip' : 'ellipsis',
            whiteSpace: expanded ? 'normal' : 'nowrap',
          }}
        >
          {action.detail}
        </Typography>
      </Box>
    </Stack>
  )
}

export function OpportunityNextActionsPanel({ actions }: OpportunityNextActionsPanelProps) {
  const t = useTranslations('crm.opportunityDetail')
  const [expandedActionKey, setExpandedActionKey] = useState<string | null>(null)

  return (
    <Box sx={{ position: 'relative', minHeight: '100%', height: { lg: '100%' } }}>
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
          {t('nextActions.title')}
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
          {actions.length > 0 ? (
            <Stack spacing={1.25}>
              {actions.map((action) => (
                <OpportunityNextActionItem
                  key={action.key}
                  action={action}
                  expanded={expandedActionKey === action.key}
                  onToggle={() =>
                    setExpandedActionKey((current) => (current === action.key ? null : action.key))
                  }
                />
              ))}
            </Stack>
          ) : (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={1}
              sx={{
                flex: 1,
                minHeight: { xs: 246, md: 258 },
                p: 2,
                borderRadius: `${radius.sm}px`,
              }}
            >
              <CalendarMonthOutlinedIcon sx={{ color: 'text.disabled' }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                {t('nextActions.empty')}
              </Typography>
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  )
}
