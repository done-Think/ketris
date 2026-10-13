'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
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
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { Controller, useForm } from 'react-hook-form'

import {
  formatIntegerCurrencyInput,
  parseIntegerCurrencyInput,
} from '@shared/lib/utils/currency-input'
import { brand, iconSize } from '@shared/theme/tokens'

import { useConvertLeadToOpportunity } from '../hooks/use-leads'
import { createConvertLeadSchema } from '../schemas/convert-lead-schema'
import type { ConvertLeadDialogProps, ConvertLeadFormValues } from '../types/lead'
import type { PublicPropertySummary } from '../types/property'
import { errorMessage } from '../utils/error-message'
import { PropertyAutocomplete } from './opportunity-detail/PropertyAutocomplete'

export function ConvertLeadDialog({ lead, onClose, open }: ConvertLeadDialogProps) {
  const t = useTranslations('crm.leads.convert')
  const locale = useLocale()
  const { enqueueSnackbar } = useSnackbar()
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''
  const convertLead = useConvertLeadToOpportunity(tenantId)
  const [property, setProperty] = useState<PublicPropertySummary | null>(null)
  const schema = useMemo(() => createConvertLeadSchema(t), [t])
  const {
    control,
    formState: { errors, isValid },
    handleSubmit,
    reset,
    setValue,
  } = useForm<ConvertLeadFormValues>({
    defaultValues: {
      propertyId: '',
      proposedValue: 0,
    },
    mode: 'onChange',
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!open) return

    setProperty(null)
    reset({ propertyId: '', proposedValue: 0 })
  }, [open, reset])

  if (!lead) return null

  const canSubmit = Boolean(property) && isValid && !convertLead.isPending

  function handlePropertyChange(nextProperty: PublicPropertySummary | null) {
    setProperty(nextProperty)
    setValue('propertyId', nextProperty?.id ?? '', { shouldDirty: true, shouldValidate: true })
  }

  function submit(values: ConvertLeadFormValues) {
    if (!property) return

    convertLead.mutate(
      {
        leadId: lead!.id,
        payload: { propertyId: property.id, proposedValue: values.proposedValue },
      },
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
          <PropertyAutocomplete
            tenantId={tenantId}
            value={property}
            onChange={handlePropertyChange}
            error={Boolean(errors.propertyId)}
            helperText={errors.propertyId?.message}
          />
          <Controller
            control={control}
            name="proposedValue"
            render={({ field, fieldState }) => (
              <TextField
                name={field.name}
                onBlur={field.onBlur}
                inputRef={field.ref}
                label={t('proposedValue')}
                fullWidth
                value={formatIntegerCurrencyInput(field.value, locale)}
                onChange={(event) =>
                  field.onChange(parseIntegerCurrencyInput(event.target.value, locale))
                }
                slotProps={{
                  htmlInput: {
                    inputMode: 'numeric',
                  },
                }}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message ?? ' '}
              />
            )}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 }}>
        <Button type="button" variant="outlined" color="secondary" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button
          type="button"
          variant="contained"
          disabled={!canSubmit}
          onClick={handleSubmit(submit)}
        >
          {t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
