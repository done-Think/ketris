'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  IconButton,
  ListSubheader,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useSharePortfolio } from '../../hooks/use-team'
import { createBrokerShareSchema } from '../../schemas/broker-team-action-schemas'
import { styles } from '../../styles/team-dialog.styles'
import type { BrokerShareDialogProps, BrokerShareFormValues } from '../../types/broker-team'
import { transferDestinations, transferSources } from '../../utils/team-member'
import { TeamDialogTitle } from './TeamDialogTitle'

export function BrokerShareDialog({
  member,
  members,
  self,
  onClose,
  revoke = false,
}: BrokerShareDialogProps) {
  const t = useTranslations('dashboard.team')
  const { enqueueSnackbar } = useSnackbar()
  const sharing = useSharePortfolio()
  const [recipientMenuOpen, setRecipientMenuOpen] = useState(false)
  const schema = useMemo(
    () =>
      createBrokerShareSchema((key) =>
        t(`dialogs.${key === 'itemsError' ? 'shareItemsError' : key}`),
      ),
    [t],
  )
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<BrokerShareFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sourceId: member.id,
      destinationIds: [],
      properties: false,
      leads: false,
      opportunities: false,
      futureEvents: false,
    },
  })
  const sourceId = useWatch({ control, name: 'sourceId' })
  const sources = transferSources(members, self)
  const destinations = transferDestinations(members, sourceId, null)
  const items = [
    ['properties', t('dialogs.itemPropertiesNoCount')],
    ['leads', t('dialogs.itemLeadsNoCount')],
    ['opportunities', t('dialogs.itemOpportunitiesNoCount')],
    ['futureEvents', t('dialogs.itemFutureEvents')],
  ] as const
  const close = () => {
    if (!sharing.isPending) onClose()
  }
  const submit = handleSubmit(async ({ sourceId: memberId, ...values }) => {
    try {
      const result = await sharing.mutateAsync({ memberId, ...values, revoke })
      enqueueSnackbar(
        t(revoke ? 'dialogs.revoked' : 'dialogs.shared', {
          properties: result.properties,
          leads: result.leads,
          opportunities: result.opportunities,
          events: result.futureEvents,
        }),
        { variant: 'success' },
      )
      onClose()
    } catch {
      enqueueSnackbar(t('dialogs.shareError'), { variant: 'error' })
    }
  })
  return (
    <Dialog open onClose={close} fullWidth maxWidth="sm">
      <Box component="form" noValidate onSubmit={submit}>
        <TeamDialogTitle
          title={t(revoke ? 'menu.revokePortfolio' : 'menu.sharePortfolio')}
          onClose={close}
        />
        <DialogContent sx={styles.content}>
          <Stack spacing={2} sx={styles.fieldsStack}>
            <Alert severity="info">{t(revoke ? 'dialogs.revokeHint' : 'dialogs.shareHint')}</Alert>
            <Controller
              name="sourceId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  disabled={sharing.isPending}
                  label={t('dialogs.shareSource')}
                  onChange={(event) => {
                    field.onChange(event)
                    setValue(
                      'destinationIds',
                      getValues('destinationIds').filter((id) => id !== event.target.value),
                    )
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
                name="destinationIds"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label={t('dialogs.shareDestination')}
                    SelectProps={{
                      multiple: true,
                      open: recipientMenuOpen,
                      onOpen: () => setRecipientMenuOpen(true),
                      onClose: () => setRecipientMenuOpen(false),
                      renderValue: () =>
                        destinations
                          .filter((destination) => field.value.includes(destination.id))
                          .map((destination) => destination.label)
                          .join(', '),
                      MenuProps: {
                        PaperProps: { sx: styles.recipientMenu },
                        MenuListProps: {
                          sx: styles.recipientMenuList,
                          subheader: (
                            <ListSubheader role="presentation" sx={styles.recipientMenuHeader}>
                              <Typography variant="subtitle2">
                                {t('dialogs.shareDestination')}
                              </Typography>
                              <IconButton
                                type="button"
                                size="small"
                                aria-label={t('dialogs.close')}
                                onClick={() => setRecipientMenuOpen(false)}
                              >
                                <CloseRoundedIcon fontSize="small" />
                              </IconButton>
                            </ListSubheader>
                          ),
                        },
                      },
                    }}
                    disabled={sharing.isPending}
                    error={Boolean(errors.destinationIds)}
                    helperText={errors.destinationIds?.message}
                  >
                    {destinations.map((destination) => (
                      <MenuItem key={destination.id} value={destination.id}>
                        <Checkbox
                          size="small"
                          checked={field.value.includes(destination.id)}
                          tabIndex={-1}
                          inputProps={{ 'aria-hidden': true }}
                        />
                        {destination.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            ) : (
              <Alert severity="info">{t('dialogs.noDestination')}</Alert>
            )}
            <Typography sx={styles.sectionTitle}>{t('dialogs.shareItems')}</Typography>
            {items.map(([name, label]) => (
              <Controller
                key={name}
                name={name}
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    label={label}
                    control={
                      <Checkbox
                        disabled={sharing.isPending}
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    }
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
          <Button onClick={close} disabled={sharing.isPending}>
            {t('dialogs.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={sharing.isPending || !destinations.length}
          >
            {t(revoke ? 'dialogs.revoke' : 'dialogs.share')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
