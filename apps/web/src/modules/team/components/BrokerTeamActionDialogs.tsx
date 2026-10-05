'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
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
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { brand } from '@shared/theme/tokens'

import { brokerGoalSchema, brokerTransferSchema } from '../schemas/broker-team-action-schemas'
import type {
  BrokerGoalFormValues,
  BrokerTeamMember,
  BrokerTransferFormValues,
} from '../types/broker-team'

type BaseProps = { broker: BrokerTeamMember | null; onClose: () => void }

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

export function BrokerPerformanceDialog({ broker, onClose }: BaseProps) {
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
}: BaseProps & {
  onSave: (brokerId: string, monthlyGoal: number) => void
}) {
  const t = useTranslations('dashboard.team')
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrokerGoalFormValues>({
    resolver: zodResolver(brokerGoalSchema),
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
}: BaseProps & {
  brokers: readonly BrokerTeamMember[]
  onTransfer: (sourceId: string, values: BrokerTransferFormValues) => void
}) {
  const t = useTranslations('dashboard.team')
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrokerTransferFormValues>({
    resolver: zodResolver(brokerTransferSchema),
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
}: BaseProps & {
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
