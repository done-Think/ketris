'use client'

import { useEffect } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { Controller, useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import { iconSize, brand, radius } from '@shared/theme/tokens'

import { maintenanceTicketSchema } from '../schemas/maintenance-ticket-schema'
import type { MaintenanceCreateTicketFormValues } from '../types/maintenance'

const defaultValues: MaintenanceCreateTicketFormValues = {
  propertyId: '',
  category: '',
  priority: 'normal',
  title: '',
  description: '',
  estimatedCost: '',
}

const propertyOptions = [
  { id: 'apt-jardins-3q', label: 'Apt Jardins 3q' },
  { id: 'studio-pinheiros', label: 'Studio Pinheiros' },
  { id: 'casa-vila-madalena', label: 'Casa Vila Madalena' },
  { id: 'cobertura-moema', label: 'Cobertura Moema' },
] as const

const categoryOptions = ['Hidráulica', 'Elétrica', 'Estrutural', 'Pintura'] as const

function formatCurrencyValue(value: string) {
  const digits = value.replace(/\D/g, '')
  const cents = digits.padStart(3, '0')
  const integer = cents.slice(0, -2).replace(/^0+(?=\d)/, '')
  return `${integer},${cents.slice(-2)}`
}

export type MaintenanceCreateTicketDialogProps = {
  open: boolean
  onClose: () => void
  onCreate: (values: MaintenanceCreateTicketFormValues) => void
}

export function MaintenanceCreateTicketDialog({
  open,
  onClose,
  onCreate,
}: MaintenanceCreateTicketDialogProps) {
  const t = useTranslations('dashboard.maintenance.createDialog')
  const maintenanceT = useTranslations('dashboard.maintenance')
  const { control, handleSubmit, reset } = useForm<MaintenanceCreateTicketFormValues>({
    defaultValues,
    resolver: zodResolver(maintenanceTicketSchema),
  })

  useEffect(() => {
    if (open) reset(defaultValues)
  }, [open, reset])

  function handleClose() {
    reset(defaultValues)
    onClose()
  }

  function handleCreate(values: MaintenanceCreateTicketFormValues) {
    onCreate(values)
    reset(defaultValues)
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
      <Box component="form" noValidate onSubmit={handleSubmit(handleCreate)}>
        <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Typography sx={{ color: brand.graphite[500], fontSize: 22, fontWeight: 900 }}>
              {t('title')}
            </Typography>
            <IconButton aria-label={t('close')} onClick={handleClose}>
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
              name="propertyId"
              label={t('fields.property')}
              select
              fullWidth
              autoFocus
            >
              {propertyOptions.map((property) => (
                <MenuItem key={property.id} value={property.id}>
                  {property.label}
                </MenuItem>
              ))}
            </RhfTextField>
            <RhfTextField
              control={control}
              name="category"
              label={t('fields.category')}
              select
              fullWidth
            >
              {categoryOptions.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </RhfTextField>
            <RhfTextField
              control={control}
              name="priority"
              label={t('fields.priority')}
              select
              fullWidth
            >
              <MenuItem value="normal">{maintenanceT('priorities.normal')}</MenuItem>
              <MenuItem value="high">{maintenanceT('priorities.high')}</MenuItem>
              <MenuItem value="urgent">{maintenanceT('priorities.urgent')}</MenuItem>
            </RhfTextField>
            <Controller
              control={control}
              name="estimatedCost"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={formatCurrencyValue(field.value ?? '')}
                  onChange={(event) => field.onChange(event.target.value.replace(/\D/g, ''))}
                  label={t('fields.estimatedCost')}
                  fullWidth
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  slotProps={{
                    htmlInput: { inputMode: 'numeric' },
                    input: {
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    },
                  }}
                />
              )}
            />
            <RhfTextField
              control={control}
              name="title"
              label={t('fields.title')}
              fullWidth
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
            <RhfTextField
              control={control}
              name="description"
              label={t('fields.description')}
              placeholder={t('fields.descriptionPlaceholder')}
              multiline
              minRows={4}
              fullWidth
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 }}>
          <Button type="button" variant="outlined" color="secondary" onClick={handleClose}>
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
