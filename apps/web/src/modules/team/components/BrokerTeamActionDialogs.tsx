'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { brand } from '@shared/theme/tokens'

import {
  createBrokerGoalSchema,
  createBrokerInviteSchema,
  createBrokerTransferSchema,
} from '../schemas/broker-team-action-schemas'
import type {
  BrokerGoalFormValues,
  BrokerInviteDialogProps,
  BrokerInviteFormValues,
  BrokerTeamDialogBaseProps,
  BrokerTeamMember,
  BrokerTransferFormValues,
} from '../types/broker-team'
import { generateTemporaryPassword } from '../utils/generate-temporary-password'

function ActionTitle({ title, onClose }: { title: string; onClose: () => void }) {
  const t = useTranslations('dashboard.team')
  return (
    <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Typography sx={{ color: brand.graphite[500], fontSize: 20, fontWeight: 900 }}>
          {title}
        </Typography>
        <IconButton aria-label={t('dialogs.close')} onClick={onClose}>
          <CloseRoundedIcon />
        </IconButton>
      </Stack>
    </DialogTitle>
  )
}

export function BrokerPerformanceDialog({ broker, onClose }: BrokerTeamDialogBaseProps) {
  const t = useTranslations('dashboard.team')
  return (
    <Dialog open={Boolean(broker)} onClose={onClose} fullWidth maxWidth="sm">
      {broker && (
        <>
          <ActionTitle
            title={t('dialogs.performanceTitle', { name: broker.name })}
            onClose={onClose}
          />
          <DialogContent sx={{ px: 3, py: 2 }}>
            <Stack spacing={2}>
              {(
                [
                  ['properties', broker.properties],
                  ['leads', broker.leads],
                  ['monthlySales', broker.monthlySales],
                  ['returns', broker.returns],
                ] as const
              ).map(([label, value]) => (
                <Stack key={label} direction="row" justifyContent="space-between">
                  <Typography>
                    {t(label === 'returns' ? 'dialogs.returns' : `metrics.${label}`)}
                  </Typography>
                  <Typography fontWeight={800}>{value}</Typography>
                </Stack>
              ))}
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>{t('goalProgress')}</Typography>
                  <Typography fontWeight={800}>{broker.goalProgress}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={Math.min(100, broker.goalProgress)} />
                <Typography variant="body2">
                  {t('dialogs.monthlyGoal')}: {broker.monthlyGoal}
                </Typography>
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={onClose}>{t('dialogs.close')}</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  )
}

export function BrokerGoalDialog({
  broker,
  onClose,
  onSave,
}: BrokerTeamDialogBaseProps & {
  onSave: (brokerId: string, monthlyGoal: number) => void
}) {
  const t = useTranslations('dashboard.team')
  const schema = useMemo(() => createBrokerGoalSchema((key) => t(`dialogs.${key}`)), [t])
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrokerGoalFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { monthlyGoal: 1 },
  })
  useEffect(() => {
    if (broker) reset({ monthlyGoal: broker.monthlyGoal })
  }, [broker, reset])
  return (
    <Dialog open={Boolean(broker)} onClose={onClose} fullWidth maxWidth="xs">
      <Box
        component="form"
        onSubmit={handleSubmit((values) => {
          if (broker) onSave(broker.id, values.monthlyGoal)
        })}
      >
        <ActionTitle title={t('menu.editGoal')} onClose={onClose} />
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Stack spacing={2}>
            <Typography>
              {t('dialogs.broker')}: <strong>{broker?.name}</strong>
            </Typography>
            <Controller
              name="monthlyGoal"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="number"
                  label={t('dialogs.monthlyGoal')}
                  inputProps={{ min: 1, step: 1 }}
                  error={Boolean(errors.monthlyGoal)}
                  helperText={errors.monthlyGoal ? t('dialogs.goalError') : undefined}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose}>{t('dialogs.cancel')}</Button>
          <Button type="submit" variant="contained">
            {t('dialogs.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

export function BrokerTransferDialog({
  broker,
  brokers,
  onClose,
  onTransfer,
}: BrokerTeamDialogBaseProps & {
  brokers: readonly BrokerTeamMember[]
  onTransfer: (sourceId: string, values: BrokerTransferFormValues) => void
}) {
  const t = useTranslations('dashboard.team')
  const schema = useMemo(() => createBrokerTransferSchema((key) => t(`dialogs.${key}`)), [t])
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrokerTransferFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { destinationId: '', leads: false, properties: false },
  })
  useEffect(() => {
    if (broker) reset({ destinationId: '', leads: false, properties: false })
  }, [broker, reset])
  return (
    <Dialog open={Boolean(broker)} onClose={onClose} fullWidth maxWidth="sm">
      <Box
        component="form"
        onSubmit={handleSubmit((values) => {
          if (broker) onTransfer(broker.id, values)
        })}
      >
        <ActionTitle title={t('menu.transferPortfolio')} onClose={onClose} />
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Stack spacing={2}>
            <Typography>
              {t('dialogs.source')}: <strong>{broker?.name}</strong>
            </Typography>
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
                  helperText={errors.destinationId ? t('dialogs.destinationError') : undefined}
                >
                  {brokers
                    .filter((item) => item.id !== broker?.id && item.active)
                    .map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name}
                      </MenuItem>
                    ))}
                </TextField>
              )}
            />
            <Typography fontWeight={700}>{t('dialogs.items')}</Typography>
            <Controller
              name="leads"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={!broker?.leads}
                    />
                  }
                  label={`${t('metrics.leads')} (${broker?.leads ?? 0})`}
                />
              )}
            />
            <Controller
              name="properties"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={!broker?.properties}
                    />
                  }
                  label={`${t('metrics.properties')} (${broker?.properties ?? 0})`}
                />
              )}
            />
            {errors.leads && (
              <Typography color="error" variant="body2">
                {t('dialogs.itemsError')}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose}>{t('dialogs.cancel')}</Button>
          <Button type="submit" variant="contained">
            {t('dialogs.transfer')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

export function BrokerDeactivateDialog({
  broker,
  onClose,
  onConfirm,
}: BrokerTeamDialogBaseProps & {
  onConfirm: (brokerId: string) => void
}) {
  const t = useTranslations('dashboard.team')
  return (
    <Dialog open={Boolean(broker)} onClose={onClose} fullWidth maxWidth="xs">
      <ActionTitle title={t('menu.deactivate')} onClose={onClose} />
      <DialogContent sx={{ px: 3, py: 2 }}>
        <Typography>{t('dialogs.deactivatePrompt', { name: broker?.name ?? '' })}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>{t('dialogs.cancel')}</Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => {
            if (broker) onConfirm(broker.id)
          }}
        >
          {t('dialogs.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function BrokerInviteDialog({
  open,
  isPending,
  onClose,
  onInvite,
}: BrokerInviteDialogProps) {
  const t = useTranslations('dashboard.team')
  const schema = useMemo(() => createBrokerInviteSchema((key) => t(`dialogs.${key}`)), [t])
  const [copied, setCopied] = useState(false)
  const {
    control,
    getValues,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BrokerInviteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' },
  })
  useEffect(() => {
    if (!open) return
    reset({ name: '', email: '', password: generateTemporaryPassword() })
    setCopied(false)
  }, [open, reset])
  const regeneratePassword = () => {
    setValue('password', generateTemporaryPassword(), { shouldValidate: true })
    setCopied(false)
  }
  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(getValues('password'))
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  return (
    <Dialog open={open} onClose={isPending ? undefined : onClose} fullWidth maxWidth="xs">
      <Box component="form" noValidate onSubmit={handleSubmit(onInvite)}>
        <ActionTitle title={t('inviteBroker')} onClose={onClose} />
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Stack spacing={2}>
            <Typography sx={{ color: brand.neutral[500], fontSize: 13 }}>
              {t('dialogs.inviteDescription')}
            </Typography>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('dialogs.inviteName')}
                  autoComplete="off"
                  autoFocus
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="email"
                  label={t('dialogs.inviteEmail')}
                  autoComplete="off"
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('dialogs.invitePassword')}
                  autoComplete="off"
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message ?? t('dialogs.invitePasswordHelper')}
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: 'monospace', letterSpacing: '0.04em' },
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={t('dialogs.generatePassword')}>
                          <IconButton
                            aria-label={t('dialogs.generatePassword')}
                            onClick={regeneratePassword}
                            edge="end"
                          >
                            <AutorenewRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={copied ? t('dialogs.passwordCopied') : t('dialogs.copyPassword')}
                        >
                          <IconButton
                            aria-label={t('dialogs.copyPassword')}
                            onClick={copyPassword}
                            edge="end"
                            sx={{ ml: 0.5, color: copied ? 'success.main' : undefined }}
                          >
                            {copied ? (
                              <CheckRoundedIcon fontSize="small" />
                            ) : (
                              <ContentCopyRoundedIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={isPending}>
            {t('dialogs.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {t('dialogs.inviteSubmit')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
