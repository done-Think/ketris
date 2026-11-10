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
import { Controller, useForm, useWatch } from 'react-hook-form'

import { useTransferPortfolio } from '../../hooks/use-team'
import { createBrokerTransferSchema } from '../../schemas/broker-team-action-schemas'
import { styles } from '../../styles/team-dialog.styles'
import type { BrokerTransferDialogProps, BrokerTransferFormValues } from '../../types/broker-team'
import { transferDestinations, transferSources } from '../../utils/team-member'
import { TeamDialogTitle } from './TeamDialogTitle'

export function BrokerTransferDialog({
  member,
  members,
  self,
  onClose,
}: BrokerTransferDialogProps) {
  const t = useTranslations('dashboard.team')
  const { enqueueSnackbar } = useSnackbar()
  const transfer = useTransferPortfolio()
  const schema = useMemo(() => createBrokerTransferSchema((key) => t(`dialogs.${key}`)), [t])
  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<BrokerTransferFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sourceId: member.id,
      destinationId: '',
      properties: false,
      leads: false,
      opportunities: false,
      futureEvents: false,
    },
  })
  const sourceId = useWatch({ control, name: 'sourceId' })
  const sources = transferSources(members, self)
  const destinations = transferDestinations(members, sourceId, self)
  const sourceMetrics = members.find((candidate) => candidate.id === sourceId)?.metrics
  const items = [
    [
      'properties',
      sourceMetrics
        ? t('dialogs.itemProperties', { count: sourceMetrics.properties })
        : t('dialogs.itemPropertiesNoCount'),
    ],
    [
      'leads',
      sourceMetrics
        ? t('dialogs.itemLeads', { count: sourceMetrics.openLeads })
        : t('dialogs.itemLeadsNoCount'),
    ],
    [
      'opportunities',
      sourceMetrics
        ? t('dialogs.itemOpportunities', { count: sourceMetrics.openOpportunities })
        : t('dialogs.itemOpportunitiesNoCount'),
    ],
    ['futureEvents', t('dialogs.itemFutureEvents')],
  ] as const

  const submit = handleSubmit(async ({ sourceId: memberId, ...values }) => {
    try {
      const result = await transfer.mutateAsync({ memberId, ...values })
      enqueueSnackbar(
        t('dialogs.transferred', {
          properties: result.properties,
          leads: result.leads,
          opportunities: result.opportunities,
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
          <Stack spacing={2} sx={styles.fieldsStack}>
            <Controller
              name="sourceId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label={t('dialogs.source')}
                  onChange={(event) => {
                    field.onChange(event)
                    if (getValues('destinationId') === event.target.value)
                      setValue('destinationId', '')
                  }}
                >
                  {sources.map((source) => (
                    <MenuItem key={source.id} value={source.id}>
                      {source.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
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
