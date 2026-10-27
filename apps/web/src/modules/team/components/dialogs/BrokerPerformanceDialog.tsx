'use client'

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'

import { styles } from '../../styles/team-dialog.styles'
import type { BrokerMemberDialogProps } from '../../types/broker-team'
import { useResponseTimeLabel } from '../../hooks/use-response-time-label'
import { TeamDialogTitle } from './TeamDialogTitle'

export function BrokerPerformanceDialog({ member, onClose }: BrokerMemberDialogProps) {
  const t = useTranslations('dashboard.team')
  const responseTime = useResponseTimeLabel(member.metrics.responseTimeMinutes)
  const rows = [
    [t('metrics.properties'), member.metrics.properties],
    [t('metrics.leads'), member.metrics.openLeads],
    [t('metrics.monthlySales'), member.metrics.monthlySales],
    [t('dialogs.returns'), member.metrics.returns],
    [t('dialogs.responseTime'), responseTime ?? '—'],
  ] as const

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <TeamDialogTitle
        title={t('dialogs.performanceTitle', { name: member.name })}
        onClose={onClose}
      />
      <DialogContent sx={styles.content}>
        <Stack spacing={2}>
          {rows.map(([label, value]) => (
            <Stack key={label} direction="row" justifyContent="space-between">
              <Typography>{label}</Typography>
              <Typography sx={styles.value}>{value}</Typography>
            </Stack>
          ))}
          {member.goal ? (
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography>{t('goalProgress')}</Typography>
                <Typography sx={styles.value}>{member.pace.goalProgress}%</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, member.pace.goalProgress ?? 0)}
              />
              <Typography variant="body2">
                {t('dialogs.monthlyGoal')}: {member.goal.monthlySales} ·{' '}
                {t('dialogs.expectedSales')}: {member.pace.expectedSales}
              </Typography>
            </Stack>
          ) : (
            <Typography variant="body2">{t('statuses.NO_GOAL')}</Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={styles.actions}>
        <Button onClick={onClose}>{t('dialogs.close')}</Button>
      </DialogActions>
    </Dialog>
  )
}
