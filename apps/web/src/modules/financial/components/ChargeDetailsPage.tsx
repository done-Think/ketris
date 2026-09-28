'use client'

import { useState } from 'react'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import PaymentRoundedIcon from '@mui/icons-material/PaymentRounded'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { useTranslations, useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'

import { useRouter } from '@/i18n/navigation'
import { RhfTextField } from '@shared/components/form'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'
import { registerPaymentSchema } from '../schemas/register-payment-schema'
import type { Charge, PaymentFormValues } from '../types/charge'
import { useChargesStore } from '../stores/charges-store'
import { chargeStatusColors as statusColors } from './charge-status-colors'
import { ChargeDocumentDialog } from './ChargeDocumentDialog'

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(value)
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        bgcolor: surface.paper,
        borderRadius: `${radius.md}px`,
        boxShadow: shadows.crmCardCompact,
        p: { xs: 2, md: 2.4 },
      }}
    >
      <Typography sx={{ color: brand.graphite[500], fontSize: 16, fontWeight: 900 }}>
        {title}
      </Typography>
      <Divider sx={{ my: 1.5, borderColor: alpha.graphite[8] }} />
      {children}
    </Box>
  )
}

export function ChargeDetailsPage({ chargeId }: { chargeId: string }) {
  const charge = useChargesStore((state) => state.charges.find((item) => item.id === chargeId))
  const t = useTranslations('charges.details')
  const router = useRouter()
  if (!charge)
    return (
      <Stack spacing={2} sx={{ p: 3 }}>
        <Typography>{t('missing')}</Typography>
        <Button onClick={() => router.push('/dashboard/finance/charges')}>{t('back')}</Button>
      </Stack>
    )
  return <ChargeDetailsContent key={charge.id} charge={charge} />
}

function ChargeDetailsContent({ charge }: { charge: Charge }) {
  const t = useTranslations('charges.details')
  const statusT = useTranslations('charges.statuses')
  const locale = useLocale()
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const registerPayment = useChargesStore((state) => state.registerPayment)
  const status = charge.status
  const paymentDate = charge.payment?.paymentDate
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const { control, handleSubmit, reset } = useForm<PaymentFormValues>({
    defaultValues: { paymentDate: '', paymentMethod: '' },
    resolver: zodResolver(registerPaymentSchema),
  })
  const statusStyle = statusColors[status]
  const dueDate = new Intl.DateTimeFormat(locale).format(new Date(`${charge.dueDate}T12:00:00`))
  const details = [
    [t('fields.type'), charge.direction === 'receivable' ? t('receivable') : t('payable')],
    [
      t('fields.competence'),
      new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
        new Date(`${charge.competence}-01T12:00:00`),
      ),
    ],
    [t('fields.amount'), formatCurrency(charge.amount, locale)],
    [t('fields.dueDate'), dueDate],
    [
      t('fields.payment'),
      paymentDate
        ? new Intl.DateTimeFormat(locale).format(new Date(`${paymentDate}T12:00:00`))
        : t('notPaid'),
    ],
    [t('fields.method'), charge.payment?.paymentMethod ?? t('notAvailable')],
    [t('fields.fees'), formatCurrency(0, locale)],
  ]
  const history = [...charge.history].reverse().map((event) => ({
    title: t(`history.${event.type}`),
    date: new Intl.DateTimeFormat(locale).format(new Date(`${event.date}T12:00:00`)),
  }))
  const submitPayment = (values: PaymentFormValues) => {
    registerPayment(charge.id, values)
    setPaymentOpen(false)
    reset(values)
    enqueueSnackbar(t('paymentSuccess'), { variant: 'success' })
  }

  return (
    <Box
      sx={{
        width: '100%',
        overflowWrap: 'anywhere',
        px: { xs: 2, md: 3.6 },
        py: { xs: 2.4, md: 3 },
      }}
    >
      <Stack spacing={2.2}>
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          color="secondary"
          onClick={() => router.push('/dashboard/finance/charges')}
          sx={{ alignSelf: 'flex-start', px: 0, fontSize: 12, textTransform: 'none' }}
        >
          {t('back')}
        </Button>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'center' }}
          spacing={1.5}
        >
          <Stack direction="row" alignItems="center" spacing={1.2} useFlexGap flexWrap="wrap">
            <Typography
              sx={{ color: brand.graphite[500], fontSize: { xs: 24, md: 25 }, fontWeight: 900 }}
            >
              {charge.code}
            </Typography>
            <Typography sx={{ color: brand.neutral[500], fontSize: 14 }}>
              {t(charge.direction)} — {charge.property} —{' '}
              {new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
                new Date(`${charge.competence}-01T12:00:00`),
              )}
            </Typography>
            <Chip
              label={statusT(status)}
              size="small"
              sx={{
                bgcolor: statusStyle.bg,
                color: statusStyle.color,
                fontWeight: 800,
                fontSize: 10,
              }}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.1}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<ContentCopyRoundedIcon />}
              onClick={() => setDuplicateOpen(true)}
            >
              {t('duplicate')}
            </Button>
            <Button
              variant="contained"
              startIcon={<PaymentRoundedIcon />}
              onClick={() => {
                reset({ paymentDate: '', paymentMethod: '' })
                setPaymentOpen(true)
              }}
              disabled={status === 'paid' || status === 'cancelled'}
            >
              {t('registerPayment')}
            </Button>
          </Stack>
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.45fr) minmax(300px, 1fr)' },
            gap: 2.2,
            alignItems: 'start',
          }}
        >
          <Stack spacing={2.2}>
            <DetailCard title={t('detailsTitle')}>
              <Stack spacing={1.35}>
                {details.map(([label, value]) => (
                  <Stack
                    key={label}
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    spacing={0.35}
                  >
                    <Typography sx={{ color: brand.neutral[500], fontSize: 12 }}>
                      {label}
                    </Typography>
                    <Typography sx={{ color: brand.graphite[500], fontSize: 12, fontWeight: 800 }}>
                      {value}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </DetailCard>
            <DetailCard title={t('receiptTitle')}>
              {charge.receiptReference && charge.payment ? (
                <Stack direction="row" spacing={1.6} alignItems="center">
                  <Box
                    sx={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 62,
                      height: 62,
                      flexShrink: 0,
                      bgcolor: brand.neutral[50],
                      borderRadius: `${radius.sm}px`,
                    }}
                  >
                    <DescriptionOutlinedIcon color="action" />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                      {charge.receiptReference}
                    </Typography>
                    <Typography sx={{ color: brand.neutral[500], fontSize: 11 }}>
                      {new Intl.DateTimeFormat(locale).format(
                        new Date(`${charge.payment.paymentDate}T12:00:00`),
                      )}{' '}
                      · {charge.payment.paymentMethod}
                    </Typography>
                    <Button
                      onClick={() => setReceiptOpen(true)}
                      sx={{ px: 0, mt: 0.4, fontSize: 12, textTransform: 'none' }}
                    >
                      {t('viewReceipt')}
                    </Button>
                  </Box>
                </Stack>
              ) : (
                <Typography color="text.secondary">{t('noReceipt')}</Typography>
              )}
            </DetailCard>
          </Stack>
          <Stack spacing={2.2}>
            <DetailCard title={t('linkingTitle')}>
              <Stack spacing={1.4}>
                <Box>
                  <Typography
                    sx={{
                      color: brand.neutral[500],
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: '.08em',
                    }}
                  >
                    {t('contract')}
                  </Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                    {charge.contractCode ?? t('notAvailable')}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      color: brand.neutral[500],
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: '.08em',
                    }}
                  >
                    {t('property')}
                  </Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{charge.property}</Typography>
                  <Typography sx={{ color: brand.neutral[500], fontSize: 11 }}>
                    {charge.address ?? t('notAvailable')}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      color: brand.neutral[500],
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: '.08em',
                    }}
                  >
                    {t('tenant')}
                  </Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{charge.tenant}</Typography>
                  <Typography sx={{ color: brand.neutral[500], fontSize: 11 }}>
                    {charge.contact ?? t('notAvailable')}
                  </Typography>
                </Box>
              </Stack>
            </DetailCard>
            <DetailCard title={t('historyTitle')}>
              <Stack spacing={1.5}>
                {history.map((event, index) => (
                  <Stack key={`${event.title}-${index}`} direction="row" spacing={1.2}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        mt: 0.55,
                        borderRadius: '50%',
                        bgcolor: 'success.main',
                        flexShrink: 0,
                      }}
                    />
                    <Box>
                      <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{event.title}</Typography>
                      <Typography sx={{ color: brand.neutral[500], fontSize: 10.5 }}>
                        {event.date}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </DetailCard>
          </Stack>
        </Box>
      </Stack>
      <Dialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: `${radius.sm}px` } } }}
      >
        <Box component="form" onSubmit={handleSubmit(submitPayment)} noValidate>
          <DialogTitle>{t('paymentDialog.title')}</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} sx={{ pt: 0.5 }}>
              <RhfTextField
                control={control}
                name="paymentDate"
                label={t('paymentDialog.date')}
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <RhfTextField
                control={control}
                name="paymentMethod"
                label={t('paymentDialog.method')}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button variant="outlined" color="secondary" onClick={() => setPaymentOpen(false)}>
              {t('paymentDialog.cancel')}
            </Button>
            <Button type="submit" variant="contained">
              {t('paymentDialog.confirm')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      <ChargeDocumentDialog
        charge={charge}
        kind="receipt"
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
      />
      <ChargeDocumentDialog
        charge={charge}
        kind="duplicate"
        open={duplicateOpen}
        onClose={() => setDuplicateOpen(false)}
      />
    </Box>
  )
}
