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

import { useResponseTimeLabel } from '../hooks/use-response-time-label'
import {
  getProgressBarStyles,
  getProgressValueStyles,
  getStatusChipStyles,
  getStatusPresentation,
  styles,
} from '../styles/broker-team-card.styles'
import type { BrokerTeamCardProps } from '../types/broker-team'
import { teamMemberContactLinks, teamMemberState } from '../utils/team-member'

export function BrokerTeamCard({
  member,
  isMenuOpen,
  onOpenProfile,
  onOpenMenu,
}: BrokerTeamCardProps) {
  const t = useTranslations('dashboard.team')
  const state = teamMemberState(member)
  const presentation = getStatusPresentation(state === 'active' ? member.pace.status : 'muted')
  const responseTime = useResponseTimeLabel(member.metrics.responseTimeMinutes)
  const links = teamMemberContactLinks(member)
  const statusLabel =
    state === 'invited'
      ? t(
          member.invitation?.status === 'EXPIRED'
            ? 'statuses.invitationExpired'
            : 'statuses.invitationPending',
        )
      : state === 'inactive'
        ? t('statuses.inactive')
        : t(`statuses.${member.pace.status}`)
  const metrics = [
    { label: t('metrics.properties'), value: member.metrics.properties },
    { label: t('metrics.leads'), value: member.metrics.openLeads },
    { label: t('metrics.monthlySales'), value: member.metrics.monthlySales },
  ]
  const contacts = [
    { key: 'message', href: links.whatsapp, icon: ChatBubbleOutlineRoundedIcon, external: true },
    { key: 'email', href: links.email, icon: EmailOutlinedIcon, external: false },
    { key: 'call', href: links.call, icon: PhoneOutlinedIcon, external: false },
  ] as const

  return (
    <Paper variant="outlined" sx={styles.card}>
      <Stack spacing={1.6}>
        <Stack direction="row" alignItems="flex-start" spacing={1.4}>
          <ButtonBase
            aria-label={t('viewProfileAriaLabel', { name: member.name })}
            disabled={!member.hasPublicProfile}
            onClick={() => onOpenProfile(member)}
            sx={styles.profileButton}
          >
            <Avatar src={member.avatarUrl ?? undefined} alt={member.name} sx={styles.avatar} />
            <Box sx={styles.identity}>
              <Typography noWrap className="broker-card-name" sx={styles.name}>
                {member.name}
              </Typography>
              {member.headline ? (
                <Typography noWrap sx={styles.headline}>
                  {member.headline}
                </Typography>
              ) : null}
              {member.specialties[0] ? (
                <Chip label={member.specialties[0]} size="small" sx={styles.specialty} />
              ) : null}
            </Box>
          </ButtonBase>
          <Tooltip title={t('moreOptions')}>
            <IconButton
              aria-label={t('moreOptions')}
              aria-controls={isMenuOpen ? 'broker-menu' : undefined}
              aria-expanded={isMenuOpen ? 'true' : undefined}
              aria-haspopup="menu"
              onClick={(event) => onOpenMenu(event.currentTarget, member)}
              sx={styles.menuButton}
            >
              <MoreVertRoundedIcon sx={styles.menuIcon} />
            </IconButton>
          </Tooltip>
        </Stack>

        <Box sx={styles.metrics}>
          {metrics.map((metric) => (
            <Box key={metric.label} sx={styles.metric}>
              <Typography sx={styles.metricValue}>{metric.value}</Typography>
              <Typography noWrap sx={styles.metricLabel}>
                {metric.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {member.goal && state === 'active' ? (
          <Stack spacing={0.85}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography sx={styles.progressLabel}>
                {t('goalProgress')} · {member.metrics.monthlySales}/{member.goal.monthlySales}
              </Typography>
              <Typography sx={getProgressValueStyles(presentation.color)}>
                {member.pace.goalProgress ?? 0}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, member.pace.goalProgress ?? 0)}
              sx={getProgressBarStyles(presentation.color)}
            />
          </Stack>
        ) : null}

        <Stack direction="row" spacing={1} sx={styles.footer}>
          <Chip
            icon={<TrendingUpRoundedIcon sx={styles.statusIcon} />}
            label={statusLabel}
            sx={getStatusChipStyles(presentation)}
          />
          <Typography sx={styles.footerText}>
            {t('returns', { count: member.metrics.returns })}
          </Typography>
        </Stack>
        <Typography sx={styles.progressLabel}>
          {responseTime ? t('responseTime', { value: responseTime }) : t('responseTimeEmpty')}
        </Typography>

        <Stack direction="row" spacing={0.9} sx={styles.contactActions}>
          {contacts.map(({ key, href, icon: Icon, external }) => (
            <Tooltip key={key} title={href ? t(`actions.${key}`) : t('actions.noPhone')}>
              <Box component="span" sx={styles.contactWrapper}>
                {href ? (
                  <IconButton
                    aria-label={t(`actions.${key}`)}
                    href={href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    <Icon sx={styles.contactIcon} />
                  </IconButton>
                ) : (
                  <IconButton aria-label={t(`actions.${key}`)} disabled>
                    <Icon sx={styles.contactIcon} />
                  </IconButton>
                )}
              </Box>
            </Tooltip>
          ))}
        </Stack>
      </Stack>
    </Paper>
  )
}
