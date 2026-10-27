'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { useTransferPortfolio } from '../../hooks/use-team'
import { createBrokerTransferSchema } from '../../schemas/broker-team-action-schemas'
import { styles } from '../../styles/team-dialog.styles'
import type {
  BrokerDestinationDialogProps,
  BrokerTransferFormValues,
} from '../../types/broker-team'
import { TeamDialogTitle } from './TeamDialogTitle'

export function BrokerTransferDialog({
  member,
  destinations,
  onClose,
}: BrokerDestinationDialogProps) {
  const t = useTranslations('dashboard.team')
  const { enqueueSnackbar } = useSnackbar()
  const transfer = useTransferPortfolio()
  const schema = useMemo(() => createBrokerTransferSchema((key) => t(`dialogs.${key}`)), [t])
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BrokerTransferFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { destinationId: '', properties: false, leads: false, futureEvents: false },
  })
  const items = [
    ['properties', t('dialogs.itemProperties', { count: member.metrics.properties })],
    ['leads', t('dialogs.itemLeads', { count: member.metrics.openLeads })],
    ['futureEvents', t('dialogs.itemFutureEvents')],
  ] as const

  const submit = handleSubmit(async (values) => {
    try {
      const result = await transfer.mutateAsync({ memberId: member.id, ...values })
      enqueueSnackbar(
        t('dialogs.transferred', {
          properties: result.properties,
          leads: result.leads,
          events: result.futureEvents,
        }),
        { variant: 'success' },
      )
      onClose()
    } catch {
      enqueueSnackbar(t('dialogs.transferError'), { variant: 'error' })
    }
  })

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" noValidate onSubmit={submit}>
        <TeamDialogTitle title={t('menu.transferPortfolio')} onClose={onClose} />
        <DialogContent sx={styles.content}>
          <Stack spacing={2}>
            <Typography>
              {t('dialogs.source')}: <strong>{member.name}</strong>
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
            <Typography sx={styles.sectionTitle}>{t('dialogs.items')}</Typography>
            {items.map(([name, label]) => (
              <Controller
                key={name}
                name={name}
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    }
                    label={label}
                  />
                )}
              />
            ))}
            {errors.properties ? (
              <Typography color="error" variant="body2">
                {errors.properties.message}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={styles.actions}>
          <Button onClick={onClose}>{t('dialogs.cancel')}</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={transfer.isPending || !destinations.length}
          >
            {t('dialogs.transfer')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
