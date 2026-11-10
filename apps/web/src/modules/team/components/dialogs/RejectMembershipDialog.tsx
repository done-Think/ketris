'use client'

import { Button, Dialog, DialogActions, DialogContent, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { extractErrorMessage } from '@shared/utils/error-message'

import { useRejectTeamMembership } from '../../hooks/use-team-memberships'
import { styles } from '../../styles/team-dialog.styles'
import type { RejectMembershipDialogProps } from '../../types/broker-team'
import { TeamDialogTitle } from './TeamDialogTitle'

export function RejectMembershipDialog({ request, onClose }: RejectMembershipDialogProps) {
  const t = useTranslations('dashboard.team.membershipRequests')
  const { enqueueSnackbar } = useSnackbar()
  const reject = useRejectTeamMembership()

  const confirm = async () => {
    try {
      await reject.mutateAsync(request.id)
      enqueueSnackbar(t('rejectSuccess', { name: request.name }), { variant: 'success' })
      onClose()
    } catch (error) {
      enqueueSnackbar(
        extractErrorMessage(error, t('rejectError'), {
          TEAM_MEMBERSHIP_REQUEST_HAS_PORTFOLIO: t('rejectHasPortfolio'),
        }),
        { variant: 'error' },
      )
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <TeamDialogTitle title={t('rejectTitle', { name: request.name })} onClose={onClose} />
      <DialogContent sx={styles.content}>
        <Typography sx={styles.description}>
          {t('rejectDescription', { name: request.name })}
        </Typography>
      </DialogContent>
      <DialogActions sx={styles.actions}>
        <Button onClick={onClose}>{t('rejectCancel')}</Button>
        <Button color="error" variant="contained" onClick={confirm} disabled={reject.isPending}>
          {t('rejectSubmit')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
