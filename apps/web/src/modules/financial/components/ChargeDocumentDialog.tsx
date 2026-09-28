import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Divider,
} from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import type { Charge } from '../types/charge'

export function ChargeDocumentDialog({
  charge,
  kind,
  open,
  onClose,
}: {
  charge: Charge
  kind: 'receipt' | 'duplicate'
  open: boolean
  onClose: () => void
}) {
  const t = useTranslations('charges.details')
  const statusT = useTranslations('charges.statuses')
  const locale = useLocale()
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale).format(new Date(`${value}T12:00:00`))
  const rows = [
    [t('tenant'), charge.tenant],
    [t('property'), charge.property],
    [t('contract'), charge.contractCode ?? t('notAvailable')],
    [t('fields.type'), t(charge.direction)],
    [
      t('fields.competence'),
      new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
        new Date(`${charge.competence}-01T12:00:00`),
      ),
    ],
    [
      t('fields.amount'),
      new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(charge.amount),
    ],
    [t('fields.dueDate'), date(charge.dueDate)],
    ...(kind === 'receipt' && charge.payment
      ? [
          [t('fields.payment'), date(charge.payment.paymentDate)],
          [t('fields.method'), charge.payment.paymentMethod],
        ]
      : []),
  ]
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="charge-document-title"
    >
      <DialogTitle id="charge-document-title">
        {t(kind === 'receipt' ? 'receiptTitle' : 'duplicate')}
      </DialogTitle>
      <DialogContent sx={{ overflowWrap: 'anywhere' }}>
        <Stack spacing={2}>
          <Typography color="text.secondary">{t('demoDocument')}</Typography>
          <Typography variant="h6">{charge.code}</Typography>
          <Typography>{statusT(charge.status)}</Typography>
          {kind === 'receipt' && (
            <Typography>{charge.receiptReference ?? t('noReceipt')}</Typography>
          )}
          <Divider />
          {rows.map(([label, value]) => (
            <Stack key={label} spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography>{value}</Typography>
            </Stack>
          ))}
          {charge.address && <Typography>{charge.address}</Typography>}
          {charge.contact && <Typography>{charge.contact}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('closeDocument')}</Button>
      </DialogActions>
    </Dialog>
  )
}
