'use client'

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
import { brand, iconSize, radius } from '@shared/theme/tokens'
import { extractErrorMessage } from '@shared/utils/error-message'

import { useUpdatePlatformPlan } from '../hooks/use-platform-plans'
import { createPlatformPlanSchema } from '../schemas/platform-plan-schema'
import type { EditPlatformPlanDialogProps, PlatformPlanFormValues } from '../types/platform-plan'
import { formatMoneyInput, parseMoneyInput } from '../utils/money-input'
import { calculateMonthlyTotal } from '../utils/plan-pricing'

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
  // Prices are kept in BRL whatever the interface language.
  const currencySymbol =
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'BRL',
      currencyDisplay: 'narrowSymbol',
    })
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value ?? 'BRL'
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
      total: format.number(calculateMonthlyTotal(price, included, extra, usage), {
        style: 'currency',
        currency: 'BRL',
      }),
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
      // Server messages are in Portuguese: show the translated text for the known codes.
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
        <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography sx={{ color: 'text.primary', fontSize: 24, fontWeight: 900 }}>
                {t('editTitle')}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 14, mt: 0.5 }}>
                {accountT(`accountTypes.${plan.accountType}`)}
              </Typography>
            </Box>
            <IconButton
              aria-label={t('closeEditDialog')}
              onClick={onClose}
              disabled={updatePlan.isPending}
            >
              <CloseRoundedIcon sx={{ fontSize: iconSize.lg }} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, md: 2.8 }, pb: 2 }}>
          <Stack spacing={2} sx={{ pt: 1 }}>
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
            {example ? (
              <Typography
                sx={{
                  p: 1.5,
                  borderRadius: `${radius.sm}px`,
                  bgcolor: brand.neutral[100],
                  color: brand.neutral[500],
                  fontSize: 13,
                }}
              >
                {example}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 }}>
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
