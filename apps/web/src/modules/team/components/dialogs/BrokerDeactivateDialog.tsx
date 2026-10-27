'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { useDeactivateBroker } from '../../hooks/use-team'
import { createBrokerDeactivateSchema } from '../../schemas/broker-team-action-schemas'
import { styles } from '../../styles/team-dialog.styles'
import type {
  BrokerDeactivateFormValues,
  BrokerDestinationDialogProps,
} from '../../types/broker-team'
import { TeamDialogTitle } from './TeamDialogTitle'

export function BrokerDeactivateDialog({
  member,
  destinations,
  onClose,
}: BrokerDestinationDialogProps) {
  const t = useTranslations('dashboard.team')
  const { enqueueSnackbar } = useSnackbar()
  const deactivate = useDeactivateBroker()
  const schema = useMemo(() => createBrokerDeactivateSchema((key) => t(`dialogs.${key}`)), [t])
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BrokerDeactivateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { destinationId: '' },
  })

  const submit = handleSubmit(async ({ destinationId }) => {
    try {
      await deactivate.mutateAsync({ memberId: member.id, destinationId })
      enqueueSnackbar(t('dialogs.deactivated', { name: member.name }), { variant: 'success' })
      onClose()
    } catch {
      enqueueSnackbar(t('dialogs.deactivateError'), { variant: 'error' })
    }
  })

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" noValidate onSubmit={submit}>
        <TeamDialogTitle
          title={t('dialogs.deactivateTitle', { name: member.name })}
          onClose={onClose}
        />
        <DialogContent sx={styles.content}>
          <Stack spacing={2}>
            <Typography sx={styles.description}>
              {t('dialogs.deactivateDescription', { name: member.name })}
            </Typography>
            {destinations.length ? (
              <Controller
                name="destinationId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    required
                    label={t('dialogs.destination')}
                    error={Boolean(errors.destinationId)}
                    helperText={errors.destinationId?.message}
                  >
                    {destinations.map((destination) => (
                      <MenuItem key={destination.id} value={destination.id}>
                        {destination.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            ) : (
              <Alert severity="info">{t('dialogs.noDestination')}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={styles.actions}>
          <Button onClick={onClose}>{t('dialogs.cancel')}</Button>
          <Button
            type="submit"
            color="error"
            variant="contained"
            disabled={deactivate.isPending || !destinations.length}
          >
            {t('dialogs.deactivateSubmit')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
