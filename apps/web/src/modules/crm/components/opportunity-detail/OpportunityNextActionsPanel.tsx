'use client'

import * as crmStyles from '../../styles/opportunity-next-actions-panel.styles'

import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { Avatar, Box, Paper, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { brand, supportColor } from '@shared/theme/tokens'

import type {
  OpportunityNextActionItemProps,
  OpportunityNextActionsPanelProps,
} from '../../types/opportunity-detail'

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

function OpportunityNextActionItem({ action, expanded, onToggle }: OpportunityNextActionItemProps) {
  const tone = toneConfig[action.tone]
  const Icon = tone.icon

  return (
    <Stack
      component="button"
      type="button"
      direction="row"
      spacing={1.5}
      onClick={onToggle}
      sx={crmStyles.stackSx}
    >
      <Avatar sx={crmStyles.getAvatarSx(tone)}>
        <Icon sx={crmStyles.iconSx} />
      </Avatar>
      <Box minWidth={0} flex={1}>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          gap={1}
          minWidth={0}
        >
          <Typography sx={crmStyles.typographySx}>{action.title}</Typography>
        </Stack>
        <Typography color="text.secondary" sx={crmStyles.getTypographySx(expanded)}>
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
    <Box sx={crmStyles.boxSx}>
      <Paper component="section" elevation={0} sx={crmStyles.paperSx}>
        <Typography component="h2" sx={crmStyles.typographySx2}>
          {t('nextActions.title')}
        </Typography>
        <Box sx={crmStyles.boxSx2}>
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
            <Stack alignItems="center" justifyContent="center" spacing={1} sx={crmStyles.stackSx2}>
              <CalendarMonthOutlinedIcon sx={crmStyles.calendarMonthOutlinedIconSx} />
              <Typography sx={crmStyles.typographySx3}>{t('nextActions.empty')}</Typography>
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  )
}
