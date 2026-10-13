'use client'

import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import {
  Avatar,
  Box,
  ButtonBase,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'

import {
  alpha,
  brand,
  iconSize,
  radius,
  shadows,
  surface,
  supportColor,
} from '@shared/theme/tokens'

import type { BrokerTeamCardProps, BrokerTeamStatus } from '../types/broker-team'

const statusPresentation: Record<BrokerTeamStatus, { color: string; bgcolor: string }> = {
  ahead: { color: brand.semantic.success, bgcolor: supportColor.successSoft },
  onTrack: { color: brand.magenta[700], bgcolor: alpha.magenta[10] },
  attention: { color: brand.semantic.warning, bgcolor: supportColor.warningSoft },
}

export function BrokerTeamCard({
  broker,
  isMenuOpen,
  onOpenProfile,
  onOpenMenu,
}: BrokerTeamCardProps) {
  const t = useTranslations('dashboard.team')
  const presentation = broker.active
    ? statusPresentation[broker.status]
    : { color: brand.neutral[500], bgcolor: alpha.graphite[8] }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderColor: alpha.graphite[8],
        borderRadius: `${radius.md}px`,
        bgcolor: surface.paper,
        boxShadow: shadows.crmCardCompact,
      }}
    >
      <Stack spacing={1.6}>
        <Stack direction="row" alignItems="flex-start" spacing={1.4}>
          <ButtonBase
            aria-label={t('viewProfileAriaLabel', { name: broker.name })}
            onClick={() => onOpenProfile(broker)}
            sx={{
              flex: 1,
              minWidth: 0,
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              gap: 1.4,
              borderRadius: `${radius.sm}px`,
              textAlign: 'left',
              '&:hover .broker-card-name, &:focus-visible .broker-card-name': {
                color: brand.magenta[700],
              },
              '&:focus-visible': {
                outline: `2px solid ${alpha.magenta[36]}`,
                outlineOffset: 3,
              },
            }}
          >
            <Avatar
              src={broker.avatarUrl}
              alt={broker.name}
              sx={{ width: 52, height: 52, bgcolor: brand.magenta[500] }}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                noWrap
                className="broker-card-name"
                sx={{
                  color: brand.graphite[500],
                  fontSize: 15,
                  fontWeight: 900,
                  transition: 'color 160ms ease',
                }}
              >
                {broker.name}
              </Typography>
              <Chip
                label={broker.role}
                size="small"
                sx={{
                  mt: 0.5,
                  height: 22,
                  borderRadius: `${radius.sm}px`,
                  bgcolor: alpha.magenta[10],
                  color: brand.magenta[700],
                  fontSize: 10.5,
                  fontWeight: 900,
                  '& .MuiChip-label': { px: 0.9 },
                }}
              />
            </Box>
          </ButtonBase>
          <Tooltip title={t('moreOptions')}>
            <IconButton
              aria-label={t('moreOptions')}
              aria-controls={isMenuOpen ? 'broker-menu' : undefined}
              aria-expanded={isMenuOpen ? 'true' : undefined}
              aria-haspopup="menu"
              onClick={(event) => onOpenMenu(event.currentTarget, broker)}
              sx={{ mt: -0.5 }}
            >
              <MoreVertRoundedIcon sx={{ fontSize: iconSize.md }} />
            </IconButton>
          </Tooltip>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 1,
            pt: 1.4,
            borderTop: '1px solid',
            borderColor: alpha.graphite[8],
          }}
        >
          {[
            { label: t('metrics.properties'), value: broker.properties },
            { label: t('metrics.leads'), value: broker.leads },
            { label: t('metrics.monthlySales'), value: broker.monthlySales },
          ].map((metric) => (
            <Box key={metric.label} sx={{ minWidth: 0 }}>
              <Typography sx={{ color: brand.graphite[500], fontSize: 15, fontWeight: 900 }}>
                {metric.value}
              </Typography>
              <Typography noWrap sx={{ color: brand.neutral[500], fontSize: 10.5 }}>
                {metric.label}
              </Typography>
            </Box>
          ))}
        </Box>

        <Stack spacing={0.85}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ color: brand.neutral[500], fontSize: 11.5 }}>
              {t('goalProgress')}
            </Typography>
            <Typography sx={{ color: presentation.color, fontSize: 11.5, fontWeight: 900 }}>
              {broker.goalProgress}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, broker.goalProgress)}
            sx={{
              height: 6,
              borderRadius: radius.full,
              bgcolor: alpha.magenta[8],
              '& .MuiLinearProgress-bar': {
                borderRadius: radius.full,
                bgcolor: presentation.color,
              },
            }}
          />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ minWidth: 0 }}>
          <Chip
            icon={<TrendingUpRoundedIcon sx={{ fontSize: iconSize.xs }} />}
            label={broker.active ? t(`statuses.${broker.status}`) : t('dialogs.inactive')}
            sx={{
              flex: 1,
              minWidth: 0,
              justifyContent: 'flex-start',
              borderRadius: `${radius.sm}px`,
              bgcolor: presentation.bgcolor,
              color: presentation.color,
              fontSize: 11,
              fontWeight: 900,
              '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
            }}
          />
          <Typography
            sx={{
              flexShrink: 0,
              alignSelf: 'center',
              color: brand.neutral[500],
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {t('returns', { count: broker.returns })}
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={0.9}
          sx={{
            '& .MuiIconButton-root': {
              flex: 1,
              height: 34,
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.app,
              color: brand.graphite[500],
              '&:hover': { bgcolor: alpha.magenta[8], color: brand.magenta[700] },
            },
          }}
        >
          <Tooltip title={t('actions.message')}>
            <IconButton aria-label={t('actions.message')}>
              <ChatBubbleOutlineRoundedIcon sx={{ fontSize: iconSize.md }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('actions.email')}>
            <IconButton aria-label={t('actions.email')}>
              <EmailOutlinedIcon sx={{ fontSize: iconSize.md }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('actions.call')}>
            <IconButton aria-label={t('actions.call')}>
              <PhoneOutlinedIcon sx={{ fontSize: iconSize.md }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  )
}
