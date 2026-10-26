import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Dialog, DialogActions, DialogContent, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'

import { createChargeReasonSchema } from '../schemas/charge-reason-schema'
import { styles } from '../styles/financial-dialog.styles'
import type { ChargeReasonDialogProps, ReasonFormValues } from '../types/charge'
import { FinancialDialogTitle } from './FinancialDialogTitle'

export function ChargeReasonDialog(props: ChargeReasonDialogProps) {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: styles.paper } }}
    >
      {props.open ? <ChargeReasonForm {...props} /> : null}
    </Dialog>
  )
}

function ChargeReasonForm({ kind, pending, onClose, onSubmit }: ChargeReasonDialogProps) {
  const t = useTranslations(`charges.reasonDialog.${kind}`)
  const errorT = useTranslations('charges.reasonDialog.errors')
  const schema = useMemo(() => createChargeReasonSchema((key) => errorT(key)), [errorT])
  const { control, handleSubmit } = useForm<ReasonFormValues>({
    defaultValues: { reason: '' },
    resolver: zodResolver(schema),
  })

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <FinancialDialogTitle title={t('title')} closeLabel={t('cancel')} onClose={onClose} />
      <DialogContent sx={styles.content}>
        <Stack spacing={1.5}>
          <Typography sx={styles.hint}>{t('description')}</Typography>
          <RhfTextField
            control={control}
            name="reason"
            label={t('reason')}
            multiline
            minRows={3}
            autoFocus
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={styles.actions}>
        <Button type="button" variant="outlined" color="secondary" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button type="submit" variant="contained" color="error" disabled={pending}>
          {t('confirm')}
        </Button>
      </DialogActions>
    </Box>
  )
}
