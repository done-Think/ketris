'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { useBrokerGoals, useSetBrokerGoal } from '../../hooks/use-team'
import { createBrokerGoalSchema } from '../../schemas/broker-team-action-schemas'
import { styles } from '../../styles/team-dialog.styles'
import type { BrokerGoalFormInput, BrokerMemberDialogProps } from '../../types/broker-team'
import { TeamDialogTitle } from './TeamDialogTitle'

export function BrokerGoalDialog({ member, onClose }: BrokerMemberDialogProps) {
  const t = useTranslations('dashboard.team')
  const format = useFormatter()
  const { enqueueSnackbar } = useSnackbar()
  const goals = useBrokerGoals(member.id)
  const setGoal = useSetBrokerGoal()
  const schema = useMemo(() => createBrokerGoalSchema((key) => t(`dialogs.${key}`)), [t])
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BrokerGoalFormInput>({
    resolver: zodResolver(schema),
    defaultValues: { monthlySales: member.goal?.monthlySales },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await setGoal.mutateAsync({
        memberId: member.id,
        monthlySales: schema.parse(values).monthlySales,
      })
      enqueueSnackbar(t('dialogs.goalSaved'), { variant: 'success' })
      onClose()
    } catch {
      enqueueSnackbar(t('dialogs.goalSaveError'), { variant: 'error' })
    }
  })

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <Box component="form" noValidate onSubmit={submit}>
        <TeamDialogTitle title={t('menu.editGoal')} onClose={onClose} />
        <DialogContent sx={styles.content}>
          <Stack spacing={2}>
            <Typography>
              {t('dialogs.broker')}: <strong>{member.name}</strong>
            </Typography>
            <Controller
              name="monthlySales"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  fullWidth
                  type="number"
                  label={t('dialogs.monthlyGoal')}
                  slotProps={{ htmlInput: { min: 1, max: 10000, step: 1 } }}
                  error={Boolean(errors.monthlySales)}
                  helperText={errors.monthlySales?.message}
                />
              )}
            />
            <Stack spacing={0.5}>
              <Typography sx={styles.sectionTitle}>{t('dialogs.goalHistory')}</Typography>
              {goals.isPending ? (
                <CircularProgress size={18} />
              ) : goals.data?.length ? (
                <Box component="ul" sx={styles.historyList}>
                  {goals.data.map((goal) => (
                    <Typography component="li" key={goal.id} sx={styles.historyItem}>
                      {t('dialogs.goalSetBy', {
                        goal: goal.monthlySales,
                        name: goal.setByName,
                        date: format.dateTime(new Date(goal.setAt), { dateStyle: 'short' }),
                      })}
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Typography sx={styles.historyItem}>{t('dialogs.goalHistoryEmpty')}</Typography>
              )}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={styles.actions}>
          <Button onClick={onClose}>{t('dialogs.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={setGoal.isPending}>
            {t('dialogs.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
