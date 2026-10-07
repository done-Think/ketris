'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { Controller, useForm } from 'react-hook-form'

import { brand, iconSize } from '@shared/theme/tokens'

import { createConvertLeadSchema } from '../schemas/convert-lead-schema'
import { useConvertLeadToOpportunity } from '../hooks/use-leads'
import type { ConvertLeadDialogProps, ConvertLeadFormValues } from '../types/lead'
import type { PublicPropertySummary } from '../types/property'
import { errorMessage } from '../utils/error-message'
import { PropertyAutocomplete } from './opportunity-detail/PropertyAutocomplete'

export function ConvertLeadDialog({ lead, onClose, open }: ConvertLeadDialogProps) {
  const t = useTranslations('crm.leads.convert')
  const { enqueueSnackbar } = useSnackbar()
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''
  const convertLead = useConvertLeadToOpportunity(tenantId)
  const schema = useMemo(() => createConvertLeadSchema((key) => t(key)), [t])
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConvertLeadFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { propertyId: '', proposedValue: 0 },
  })
  const [selectedProperty, setSelectedProperty] = useState<PublicPropertySummary | null>(null)

  useEffect(() => {
    if (!open) return

    reset({ propertyId: '', proposedValue: 0 })
    setSelectedProperty(null)
  }, [open, reset])

  if (!lead) return null

  function onSubmit(values: ConvertLeadFormValues) {
    convertLead.mutate(
      { leadId: lead!.id, payload: values },
      {
        onSuccess: () => {
          enqueueSnackbar(t('success'), { variant: 'success' })
          onClose()
        },
        onError: (error) => {
          enqueueSnackbar(errorMessage(error, t('error')), { variant: 'error' })
        },
      },
    )
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: brand.magenta[600], fontSize: 13, fontWeight: 900 }}>
                {t('eyebrow')}
              </Typography>
              <Typography sx={{ color: brand.graphite[500], fontSize: 22, fontWeight: 900 }}>
                {t('title', { name: lead.name })}
              </Typography>
            </Box>
            <IconButton aria-label={t('close')} onClick={onClose}>
              <CloseRoundedIcon sx={{ fontSize: iconSize.lg }} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 2, md: 2.8 }, pb: 2 }}>
          <Stack spacing={2}>
            <Controller
              control={control}
              name="propertyId"
              render={({ field }) => (
                <PropertyAutocomplete
                  tenantId={tenantId}
                  value={selectedProperty}
                  onChange={(nextProperty) => {
                    setSelectedProperty(nextProperty)
                    field.onChange(nextProperty?.id ?? '')
                  }}
                  error={Boolean(errors.propertyId)}
                  helperText={errors.propertyId?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="proposedValue"
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('proposedValue')}
                  type="number"
                  fullWidth
                  error={Boolean(errors.proposedValue)}
                  helperText={errors.proposedValue?.message ?? ' '}
                />
              )}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 }}>
          <Button type="button" variant="outlined" color="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={convertLead.isPending}>
            {t('confirm')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
