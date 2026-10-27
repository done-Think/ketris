'use client'

import { Button, Dialog, DialogActions, DialogContent, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { extractErrorMessage } from '@shared/utils/error-message'

import { useCancelInvitation } from '../../hooks/use-team'
import { styles } from '../../styles/team-dialog.styles'
import type { BrokerMemberDialogProps } from '../../types/broker-team'
import { TeamDialogTitle } from './TeamDialogTitle'

export function CancelInvitationDialog({ member, onClose }: BrokerMemberDialogProps) {
  const t = useTranslations('dashboard.team')
  const { enqueueSnackbar } = useSnackbar()
  const cancel = useCancelInvitation()

  const confirm = async () => {
    try {
      await cancel.mutateAsync(member.id)
      enqueueSnackbar(t('dialogs.invitationCanceled'), { variant: 'success' })
      onClose()
    } catch (error) {
      enqueueSnackbar(
        extractErrorMessage(error, t('dialogs.invitationCancelError'), {
          TEAM_INVITATION_HAS_PORTFOLIO: t('dialogs.invitationHasPortfolio'),
        }),
        { variant: 'error' },
      )
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <TeamDialogTitle
        title={t('dialogs.cancelInvitationTitle', { name: member.name })}
        onClose={onClose}
      />
      <DialogContent sx={styles.content}>
        <Typography sx={styles.description}>
          {t('dialogs.cancelInvitationDescription', { name: member.name })}
        </Typography>
      </DialogContent>
      <DialogActions sx={styles.actions}>
        <Button onClick={onClose}>{t('dialogs.cancel')}</Button>
        <Button color="error" variant="contained" onClick={confirm} disabled={cancel.isPending}>
          {t('dialogs.cancelInvitationSubmit')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
