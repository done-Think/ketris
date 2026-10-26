import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Dialog, DialogActions, DialogContent, Stack } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'

import { createRegisterPaymentSchema } from '../schemas/register-payment-schema'
import { styles } from '../styles/financial-dialog.styles'
import type { PaymentFormValues, RegisterPaymentDialogProps } from '../types/charge'
import { FinancialDialogTitle } from './FinancialDialogTitle'
import { ReceiptFileField } from './ReceiptFileField'

export function RegisterPaymentDialog(props: RegisterPaymentDialogProps) {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: styles.paper } }}
    >
      {props.open ? <RegisterPaymentForm {...props} /> : null}
    </Dialog>
  )
}

function RegisterPaymentForm({ pending, onClose, onSubmit }: RegisterPaymentDialogProps) {
  const t = useTranslations('charges.paymentDialog')
  const schema = useMemo(() => createRegisterPaymentSchema((key) => t(`errors.${key}`)), [t])
  const { control, handleSubmit } = useForm<PaymentFormValues>({
    defaultValues: { paymentDate: '', paymentMethod: '', receipt: null },
    resolver: zodResolver(schema),
  })

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <FinancialDialogTitle title={t('title')} closeLabel={t('cancel')} onClose={onClose} />
      <DialogContent sx={styles.content}>
        <Stack spacing={1.5}>
          <RhfTextField
            control={control}
            name="paymentDate"
            label={t('date')}
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <RhfTextField control={control} name="paymentMethod" label={t('method')} fullWidth />
          <Controller
            control={control}
            name="receipt"
            render={({ field, fieldState }) => (
              <ReceiptFileField
                file={field.value}
                error={fieldState.error?.message}
                onChange={field.onChange}
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={styles.actions}>
        <Button type="button" variant="outlined" color="secondary" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button type="submit" variant="contained" disabled={pending}>
          {t(pending ? 'sending' : 'confirm')}
        </Button>
      </DialogActions>
    </Box>
  )
}
