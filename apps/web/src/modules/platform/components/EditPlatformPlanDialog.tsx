'use client'

import { formatCurrency, formatCurrencySymbol } from '@shared/lib/utils/format'

import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  Typography,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { useSnackbar } from 'notistack'

import { RhfTextField } from '@shared/components/form'
import { extractErrorMessage } from '@shared/utils/error-message'

import { useUpdatePlatformPlan } from '../hooks/use-platform-billing'
import { createPlatformPlanSchema } from '../schemas/platform-plan-schema'
import type { EditPlatformPlanDialogProps, PlatformPlanFormValues } from '../types/platform-plan'
import { formatMoneyInput, parseMoneyInput } from '../utils/money-input'
import { calculateMonthlyTotal } from '../utils/plan-pricing'
import { styles } from '../styles/edit-platform-plan-dialog.styles'

const EXAMPLE_EXTRA_UNITS = 2

export function EditPlatformPlanDialog({ plan, onClose }: EditPlatformPlanDialogProps) {
  const t = useTranslations('platform.plans')
  const accountT = useTranslations('platform.account')
  const locale = useLocale()
  const format = useFormatter()
  const { enqueueSnackbar } = useSnackbar()
  const updatePlan = useUpdatePlatformPlan()
  const schema = useMemo(
    () => createPlatformPlanSchema((key) => t(`errors.${key}`), locale),
    [t, locale],
  )
  const unit = plan.usageUnit === 'BROKERS' ? 'Brokers' : 'Properties'
  const currencySymbol = formatCurrencySymbol(locale)
  const moneyAdornment = <InputAdornment position="start">{currencySymbol}</InputAdornment>

  const { control, handleSubmit, watch } = useForm<PlatformPlanFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      monthlyPrice: formatMoneyInput(plan.monthlyPrice, locale),
      includedUnits: String(plan.includedUnits),
      extraUnitPrice: formatMoneyInput(plan.extraUnitPrice, locale),
    },
  })

  const [monthlyPrice, includedUnits, extraUnitPrice] = watch([
    'monthlyPrice',
    'includedUnits',
    'extraUnitPrice',
  ])
  const example = (() => {
    const price = parseMoneyInput(monthlyPrice, locale)
    const extra = parseMoneyInput(extraUnitPrice, locale)
    const included = /^\d+$/.test(includedUnits.trim()) ? Number(includedUnits) : null
    if (price === null || extra === null || included === null) return null

    const usage = included + EXAMPLE_EXTRA_UNITS
    return t(`example${unit}`, {
      count: usage,
      total: formatCurrency(calculateMonthlyTotal(price, included, extra, usage), format.number),
    })
  })()

  async function onSubmit(values: PlatformPlanFormValues) {
    try {
      await updatePlan.mutateAsync({
        accountType: plan.accountType,
        monthlyPrice: parseMoneyInput(values.monthlyPrice, locale) ?? 0,
        includedUnits: Number(values.includedUnits),
        extraUnitPrice: parseMoneyInput(values.extraUnitPrice, locale) ?? 0,
      })
      enqueueSnackbar(t('updateSuccess'), { variant: 'success' })
      onClose()
    } catch (error) {
      enqueueSnackbar(
        extractErrorMessage(error, t('updateError'), {
          FORBIDDEN: t('errors.forbidden'),
          PLATFORM_PLAN_NOT_FOUND: t('errors.notFound'),
        }),
        { variant: 'error' },
      )
    }
  }

  return (
    <Dialog open onClose={() => !updatePlan.isPending && onClose()} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle sx={styles.dialogTitle}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography sx={styles.typography}>{t('editTitle')}</Typography>
              <Typography sx={styles.typography2}>
                {accountT(`accountTypes.${plan.accountType}`)}
              </Typography>
            </Box>
            <IconButton
              aria-label={t('closeEditDialog')}
              onClick={onClose}
              disabled={updatePlan.isPending}
            >
              <CloseRoundedIcon sx={styles.closeRoundedIcon} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={styles.dialogContent}>
          <Stack spacing={2} sx={styles.stack}>
            <RhfTextField
              control={control}
              name="monthlyPrice"
              label={t('fields.monthlyPrice')}
              fullWidth
              slotProps={{
                htmlInput: { inputMode: 'decimal' },
                input: { startAdornment: moneyAdornment },
              }}
            />
            <RhfTextField
              control={control}
              name="includedUnits"
              label={t(`fields.includedUnits${unit}`)}
              fullWidth
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            />
            <RhfTextField
              control={control}
              name="extraUnitPrice"
              label={t(`fields.extraUnitPrice${unit}`)}
              fullWidth
              slotProps={{
                htmlInput: { inputMode: 'decimal' },
                input: { startAdornment: moneyAdornment },
              }}
            />
            {example ? <Typography sx={styles.typography3}>{example}</Typography> : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={styles.dialogActions}>
          <Button
            type="button"
            variant="outlined"
            color="secondary"
            onClick={onClose}
            disabled={updatePlan.isPending}
          >
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={updatePlan.isPending}>
            {t('save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
