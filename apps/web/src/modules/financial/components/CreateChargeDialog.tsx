'use client'

import { useEffect } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
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
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import { brand, iconSize, radius } from '@shared/theme/tokens'
import { createChargeSchema } from '../schemas/create-charge-schema'
import type { CreateChargeFormValues } from '../types/charge'

const defaultValues: CreateChargeFormValues = {
  tenant: '',
  property: '',
  amount: 0,
  dueDate: '',
  direction: 'receivable',
  status: 'pending',
}

export function CreateChargeDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (values: CreateChargeFormValues) => void
}) {
  const t = useTranslations('charges.createDialog')
  const { control, handleSubmit, reset } = useForm<CreateChargeFormValues>({
    defaultValues,
    resolver: zodResolver(createChargeSchema),
  })
  useEffect(() => {
    if (open) reset(defaultValues)
  }, [open, reset])
  const submit = (values: CreateChargeFormValues) => {
    onCreate(values)
    reset(defaultValues)
  }
  return (
    <Dialog
      open={open}
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
      <Box component="form" noValidate onSubmit={handleSubmit(submit)}>
        <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ color: brand.graphite[500], fontSize: 22, fontWeight: 900 }}>
              {t('title')}
            </Typography>
            <IconButton aria-label={t('close')} onClick={onClose}>
              <CloseRoundedIcon sx={{ fontSize: iconSize.lg }} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, md: 2.8 }, pb: 2, pt: '12px !important' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 1.5,
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
              <MenuItem value="receivable">{t('directions.receivable')}</MenuItem>
              <MenuItem value="payable">{t('directions.payable')}</MenuItem>
            </RhfTextField>
            <RhfTextField
              control={control}
              name="status"
              label={t('fields.status')}
              select
              fullWidth
            >
              <MenuItem value="pending">{t('statuses.pending')}</MenuItem>
              <MenuItem value="scheduled">{t('statuses.scheduled')}</MenuItem>
            </RhfTextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 }}>
          <Button type="button" variant="outlined" color="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained" startIcon={<AddRoundedIcon />}>
            {t('submit')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
