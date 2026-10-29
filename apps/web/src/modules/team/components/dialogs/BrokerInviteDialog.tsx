'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Dialog, DialogActions, DialogContent, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import { extractErrorMessage } from '@shared/utils/error-message'

import { useInviteBroker } from '../../hooks/use-team'
import { createBrokerInviteSchema } from '../../schemas/broker-team-action-schemas'
import { styles } from '../../styles/team-dialog.styles'
import type { BrokerInviteDialogProps, BrokerInviteFormValues } from '../../types/broker-team'
import { TeamDialogTitle } from './TeamDialogTitle'

export function BrokerInviteDialog({ onClose }: BrokerInviteDialogProps) {
  const t = useTranslations('dashboard.team')
  const { enqueueSnackbar } = useSnackbar()
  const invite = useInviteBroker()
  const schema = useMemo(() => createBrokerInviteSchema((key) => t(`dialogs.${key}`)), [t])
  const { control, handleSubmit } = useForm<BrokerInviteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '' },
  })

  const submit = handleSubmit(async (values) => {
    try {
      const result = await invite.mutateAsync(values)
      enqueueSnackbar(
        result.emailDelivered
          ? t('dialogs.invited', { email: values.email })
          : t('dialogs.invitedEmailFailed'),
        { variant: result.emailDelivered ? 'success' : 'warning' },
      )
      onClose()
    } catch (error) {
      enqueueSnackbar(
        extractErrorMessage(error, t('dialogs.inviteError'), {
          EMAIL_ALREADY_IN_USE: t('dialogs.inviteEmailInUse'),
        }),
        { variant: 'error' },
      )
    }
  })

  return (
    <Dialog open onClose={invite.isPending ? undefined : onClose} fullWidth maxWidth="xs">
      <Box component="form" noValidate onSubmit={submit}>
        <TeamDialogTitle title={t('inviteBroker')} onClose={onClose} />
        <DialogContent sx={styles.content}>
          <Stack spacing={2}>
            <Typography sx={styles.description}>{t('dialogs.inviteDescription')}</Typography>
            <RhfTextField
              control={control}
              name="name"
              label={t('dialogs.inviteName')}
              autoComplete="off"
              autoFocus
            />
            <RhfTextField
              control={control}
              name="email"
              type="email"
              label={t('dialogs.inviteEmail')}
              autoComplete="off"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={styles.actions}>
          <Button onClick={onClose} disabled={invite.isPending}>
            {t('dialogs.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={invite.isPending}>
            {t('dialogs.inviteSubmit')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
