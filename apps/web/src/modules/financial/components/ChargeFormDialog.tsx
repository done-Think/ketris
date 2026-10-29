import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'

import { chargeDirections, newChargeStatuses } from '../config/charge-status'
import { createChargeFormSchema } from '../schemas/charge-form-schema'
import { styles } from '../styles/financial-dialog.styles'
import type { ChargeFormDialogProps, ChargeFormValues } from '../types/charge'
import { chargeToFormValues, isLockedCharge } from '../utils/charge-adapter'
import { FinancialDialogTitle } from './FinancialDialogTitle'

export function ChargeFormDialog(props: ChargeFormDialogProps) {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: styles.paper } }}
    >
      {props.open ? <ChargeForm key={props.charge?.id ?? 'new'} {...props} /> : null}
    </Dialog>
  )
}

function ChargeForm({ charge, pending, onClose, onSubmit }: ChargeFormDialogProps) {
  const t = useTranslations('charges.formDialog')
  const creating = charge === null
  const locked = charge ? isLockedCharge(charge) : false
  const descriptionRequired = !charge?.contractId
  const schema = useMemo(
    () => createChargeFormSchema((key) => t(`errors.${key}`), descriptionRequired),
    [t, descriptionRequired],
  )
  const { control, handleSubmit } = useForm<ChargeFormValues>({
    defaultValues: chargeToFormValues(charge),
    resolver: zodResolver(schema),
  })

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <FinancialDialogTitle
        title={t(creating ? 'createTitle' : 'editTitle')}
        closeLabel={t('close')}
        onClose={onClose}
      />
      <DialogContent sx={styles.content}>
        <Box sx={styles.grid}>
          <RhfTextField
            control={control}
            name="description"
            label={t('fields.description')}
            autoFocus
            fullWidth
            sx={styles.fullRow}
          />
          <RhfTextField
            control={control}
            name="amount"
            label={t('fields.amount')}
            type="number"
            disabled={locked}
            slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
            fullWidth
          />
          <RhfTextField
            control={control}
            name="dueDate"
            label={t('fields.dueDate')}
            type="date"
            disabled={locked}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <RhfTextField
            control={control}
            name="direction"
            label={t('fields.direction')}
            select
            disabled={locked}
            fullWidth
          >
            {chargeDirections.map((direction) => (
              <MenuItem key={direction} value={direction}>
                {t(`directions.${direction}`)}
              </MenuItem>
            ))}
          </RhfTextField>
          {creating ? (
            <RhfTextField
              control={control}
              name="status"
              label={t('fields.status')}
              select
              fullWidth
            >
              {newChargeStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {t(`statuses.${status}`)}
                </MenuItem>
              ))}
            </RhfTextField>
          ) : null}
          <Typography sx={[styles.hint, styles.fullRow]}>
            {t(creating ? 'createHint' : locked ? 'lockedHint' : 'editHint')}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={styles.actions}>
        <Button type="button" variant="outlined" color="secondary" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button type="submit" variant="contained" disabled={pending}>
          {t(creating ? 'create' : 'save')}
        </Button>
      </DialogActions>
    </Box>
  )
}
