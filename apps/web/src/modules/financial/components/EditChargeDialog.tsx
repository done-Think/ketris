'use client'

import { useEffect } from 'react'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import { brand, iconSize, radius } from '@shared/theme/tokens'
import { updateChargeSchema } from '../schemas/update-charge-schema'
import type { Charge, UpdateChargeFormValues } from '../types/charge'

export function EditChargeDialog({
  charge,
  onClose,
  onSave,
}: {
  charge: Charge | null
  onClose: () => void
  onSave: (id: string, values: UpdateChargeFormValues) => void
}) {
  const t = useTranslations('charges.editDialog')
  const commonT = useTranslations('charges')
  const { control, handleSubmit, reset } = useForm<UpdateChargeFormValues>({
    resolver: zodResolver(updateChargeSchema),
  })

  useEffect(() => {
    if (charge) {
      reset({
        tenant: charge.tenant,
        property: charge.property,
        amount: charge.amount,
        dueDate: charge.dueDate,
        direction: charge.direction,
        status: charge.status,
      })
    }
  }, [charge, reset])

  if (!charge) return null

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${radius.sm}px`,
            maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
          },
        },
      }}
    >
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit((values) => onSave(charge.id, values))}
      >
        <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Typography sx={{ color: brand.graphite[500], fontSize: 22, fontWeight: 900 }}>
              {t('title')}
            </Typography>
            <IconButton aria-label={t('close')} onClick={onClose}>
              <CloseRoundedIcon sx={{ fontSize: iconSize.lg }} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, md: 2.8 }, pb: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
              gap: 1.6,
              pt: 0.5,
            }}
          >
            <RhfTextField
              control={control}
              name="tenant"
              label={t('fields.tenant')}
              autoFocus
              fullWidth
            />
            <RhfTextField
              control={control}
              name="property"
              label={t('fields.property')}
              fullWidth
            />
            <RhfTextField
              control={control}
              name="amount"
              label={t('fields.amount')}
              type="number"
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              fullWidth
            />
            <RhfTextField
              control={control}
              name="dueDate"
              label={t('fields.dueDate')}
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <RhfTextField
              control={control}
              name="direction"
              label={t('fields.direction')}
              select
              fullWidth
            >
              <MenuItem value="receivable">{commonT('tabs.receivable')}</MenuItem>
              <MenuItem value="payable">{commonT('tabs.payable')}</MenuItem>
            </RhfTextField>
            <RhfTextField
              control={control}
              name="status"
              label={t('fields.status')}
              helperText={t('paymentHint')}
              select
              fullWidth
            >
              {(['pending', 'overdue', 'paid', 'scheduled', 'cancelled'] as const).map((status) => (
                <MenuItem
                  key={status}
                  value={status}
                  disabled={status === 'paid' && !charge.payment}
                >
                  {commonT(`statuses.${status}`)}
                </MenuItem>
              ))}
            </RhfTextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 }}>
          <Button type="button" variant="outlined" color="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained" startIcon={<EditRoundedIcon />}>
            {t('save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
