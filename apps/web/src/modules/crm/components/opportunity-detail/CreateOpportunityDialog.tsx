import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'

import { createOpportunityFormSchema } from '../../schemas/opportunity-schema'
import type { CreateOpportunityFormValues } from '../../types/opportunity'
import type { PublicPropertySummary } from '../../types/property'
import { PropertyAutocomplete } from './PropertyAutocomplete'

const emptyCreateOpportunityValues: CreateOpportunityFormValues = {
  propertyId: '',
  leadName: '',
  leadEmail: '',
  leadPhone: '',
  proposedValue: '',
  notes: '',
  status: 'RASCUNHO',
}

export interface CreateOpportunityDialogProps {
  open: boolean
  tenantId: string
  isPending: boolean
  onClose: () => void
  onSave: (values: CreateOpportunityFormValues) => void
}

export function CreateOpportunityDialog({
  open,
  tenantId,
  isPending,
  onClose,
  onSave,
}: CreateOpportunityDialogProps) {
  const t = useTranslations('crm.opportunityDetail')
  const [selectedProperty, setSelectedProperty] = useState<PublicPropertySummary | null>(null)
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<CreateOpportunityFormValues>({
    defaultValues: emptyCreateOpportunityValues,
    resolver: zodResolver(createOpportunityFormSchema),
  })

  useEffect(() => {
    if (open) {
      reset(emptyCreateOpportunityValues)
      setSelectedProperty(null)
    }
  }, [open, reset])

  return (
    <Dialog open={open} onClose={() => !isPending && onClose()} fullWidth maxWidth="sm">
      <Box component="form" noValidate onSubmit={handleSubmit(onSave)}>
        <DialogTitle sx={{ letterSpacing: 0 }}>{t('createTitle')}</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
              gap: 2,
              pt: 1,
            }}
          >
            <Controller
              control={control}
              name="propertyId"
              render={({ field }) => (
                <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                  <PropertyAutocomplete
                    tenantId={tenantId}
                    value={selectedProperty}
                    onChange={(property) => {
                      setSelectedProperty(property)
                      field.onChange(property?.id ?? '')
                    }}
                    error={Boolean(errors.propertyId)}
                    helperText={errors.propertyId?.message}
                  />
                </Box>
              )}
            />
            <TextField
              label={t('fields.name')}
              required
              error={Boolean(errors.leadName)}
              helperText={errors.leadName?.message}
              {...register('leadName')}
            />
            <TextField
              label={t('fields.email')}
              type="email"
              required
              error={Boolean(errors.leadEmail)}
              helperText={errors.leadEmail?.message}
              {...register('leadEmail')}
            />
            <TextField
              label={t('fields.phone')}
              error={Boolean(errors.leadPhone)}
              helperText={errors.leadPhone?.message}
              {...register('leadPhone')}
            />
            <TextField
              label={t('fields.proposedValue')}
              type="number"
              required
              slotProps={{ htmlInput: { min: 0, step: 100 } }}
              error={Boolean(errors.proposedValue)}
              helperText={errors.proposedValue?.message}
              {...register('proposedValue')}
            />
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <FormControl>
                  <InputLabel id="create-opportunity-status-label">{t('fields.status')}</InputLabel>
                  <Select
                    labelId="create-opportunity-status-label"
                    label={t('fields.status')}
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(event.target.value as CreateOpportunityFormValues['status'])
                    }
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                  >
                    <MenuItem value="RASCUNHO">{t('statuses.RASCUNHO')}</MenuItem>
                    <MenuItem value="ENVIADA">{t('statuses.ENVIADA')}</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            <TextField
              label={t('fields.notes')}
              multiline
              minRows={3}
              error={Boolean(errors.notes)}
              helperText={errors.notes?.message}
              sx={{ gridColumn: { sm: '1 / -1' } }}
              {...register('notes')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button disabled={isPending} onClick={onClose}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? <CircularProgress size={20} /> : t('actions.createOpportunity')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
