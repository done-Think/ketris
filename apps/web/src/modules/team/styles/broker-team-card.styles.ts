import type { SxProps, Theme } from '@mui/material'

import {
  alpha,
  brand,
  iconSize,
  radius,
  shadows,
  surface,
  supportColor,
} from '@shared/theme/tokens'

import type { TeamPaceStatus } from '../types/team'

const statusPresentation: Record<TeamPaceStatus | 'muted', { color: string; bgcolor: string }> = {
  AHEAD: { color: brand.semantic.success, bgcolor: supportColor.successSoft },
  ON_TRACK: { color: brand.magenta[700], bgcolor: alpha.magenta[10] },
  ATTENTION: { color: brand.semantic.warning, bgcolor: supportColor.warningSoft },
  NO_GOAL: { color: brand.neutral[500], bgcolor: alpha.graphite[8] },
  muted: { color: brand.neutral[500], bgcolor: alpha.graphite[8] },
}

export const styles = {
  card: {
    p: 2,
    borderColor: alpha.graphite[8],
    borderRadius: `${radius.md}px`,
    bgcolor: surface.paper,
    boxShadow: shadows.crmCardCompact,
  },
  profileButton: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: 1.4,
    borderRadius: `${radius.sm}px`,
    textAlign: 'left',
    '&:hover .broker-card-name, &:focus-visible .broker-card-name': { color: brand.magenta[700] },
    '&:focus-visible': { outline: `2px solid ${alpha.magenta[36]}`, outlineOffset: 3 },
    '&.Mui-disabled': { opacity: 1 },
  },
  avatar: { width: 52, height: 52, bgcolor: brand.magenta[500] },
  identity: { minWidth: 0, flex: 1 },
  name: {
    color: brand.graphite[500],
    fontSize: 15,
    fontWeight: 900,
    transition: 'color 160ms ease',
  },
  headline: { color: brand.neutral[500], fontSize: 12, mt: 0.2 },
  specialty: {
    mt: 0.5,
    height: 22,
    borderRadius: `${radius.sm}px`,
    bgcolor: alpha.magenta[10],
    color: brand.magenta[700],
    fontSize: 10.5,
    fontWeight: 900,
    '& .MuiChip-label': { px: 0.9 },
  },
  menuButton: { mt: -0.5 },
  menuIcon: { fontSize: iconSize.md },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 1,
    pt: 1.4,
    borderTop: '1px solid',
    borderColor: alpha.graphite[8],
  },
  metric: { minWidth: 0 },
  metricValue: { color: brand.graphite[500], fontSize: 15, fontWeight: 900 },
  metricLabel: { color: brand.neutral[500], fontSize: 10.5 },
  progressLabel: { color: brand.neutral[500], fontSize: 11.5 },
  footer: { minWidth: 0 },
  footerText: {
    flexShrink: 0,
    alignSelf: 'center',
    color: brand.neutral[500],
    fontSize: 11,
    fontWeight: 800,
  },
  contactActions: {
    '& .MuiIconButton-root': {
      flex: 1,
      height: 34,
      borderRadius: `${radius.sm}px`,
      bgcolor: surface.app,
      color: brand.graphite[500],
      '&:hover': { bgcolor: alpha.magenta[8], color: brand.magenta[700] },
    },
  },
  contactWrapper: { flex: 1, display: 'flex' },
  contactIcon: { fontSize: iconSize.md },
  statusIcon: { fontSize: iconSize.xs },
} satisfies Record<string, SxProps<Theme>>

export function getStatusPresentation(status: TeamPaceStatus | 'muted') {
  return statusPresentation[status]
}

export function getProgressValueStyles(color: string): SxProps<Theme> {
  return { color, fontSize: 11.5, fontWeight: 900 }
}

export function getProgressBarStyles(color: string): SxProps<Theme> {
  return {
    height: 6,
    borderRadius: radius.full,
    bgcolor: alpha.magenta[8],
    '& .MuiLinearProgress-bar': { borderRadius: radius.full, bgcolor: color },
  }
}

export function getStatusChipStyles(presentation: {
  color: string
  bgcolor: string
}): SxProps<Theme> {
  return {
    flex: 1,
    minWidth: 0,
    justifyContent: 'flex-start',
    borderRadius: `${radius.sm}px`,
    bgcolor: presentation.bgcolor,
    color: presentation.color,
    fontSize: 11,
    fontWeight: 900,
    '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
  }
}
