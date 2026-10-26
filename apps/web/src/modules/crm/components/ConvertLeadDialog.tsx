'use client'

import * as crmStyles from '../styles/convert-lead-dialog.styles'

import { zodResolver } from '@hookform/resolvers/zod'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
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
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { useConvertLeadToOpportunity } from '../hooks/use-leads'
import { createConvertLeadSchema } from '../schemas/convert-lead-schema'
import type { ConvertLeadDialogProps, ConvertLeadFormValues } from '../types/lead'
import { errorMessage } from '../utils/error-message'
import { PropertyAutocomplete } from './opportunity-detail/PropertyAutocomplete'

export function ConvertLeadDialog(props: ConvertLeadDialogProps) {
  return props.open && props.lead ? <ConvertLeadForm {...props} /> : null
}

function ConvertLeadForm({ lead, onClose, open }: ConvertLeadDialogProps) {
  const t = useTranslations('crm.leads.convert')
  const { enqueueSnackbar } = useSnackbar()
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''
  const convertLead = useConvertLeadToOpportunity(tenantId)
  const schema = useMemo(() => createConvertLeadSchema(t), [t])
  const {
    control,
    formState: { isValid },
    handleSubmit,
  } = useForm<ConvertLeadFormValues>({
    defaultValues: {
      property: null,
      email: lead?.email ?? '',
      proposedValue: 0,
    },
    mode: 'onChange',
    resolver: zodResolver(schema),
  })

  if (!lead) return null

  const canSubmit = isValid && !convertLead.isPending

  function submit(values: ConvertLeadFormValues) {
    if (!values.property) return

    convertLead.mutate(
      {
        leadId: lead!.id,
        payload: {
          propertyId: values.property.id,
          proposedValue: values.proposedValue,
          email: values.email,
        },
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
      <DialogTitle sx={crmStyles.dialogTitleSx}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box sx={crmStyles.boxSx}>
            <Typography sx={crmStyles.typographySx}>{t('eyebrow')}</Typography>
            <Typography sx={crmStyles.typographySx2}>{t('title', { name: lead.name })}</Typography>
          </Box>
          <IconButton aria-label={t('close')} onClick={onClose}>
            <CloseRoundedIcon sx={crmStyles.closeRoundedIconSx} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={crmStyles.dialogContentSx}>
        <Stack spacing={2}>
          <Controller
            control={control}
            name="property"
            render={({ field, fieldState }) => (
              <PropertyAutocomplete
                tenantId={tenantId}
                value={field.value}
                onChange={field.onChange}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="email"
                required
                label={t('email')}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
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
                type="number"
                value={field.value || ''}
                onChange={(event) => field.onChange(Number(event.target.value))}
                slotProps={{
                  htmlInput: {
                    inputMode: 'decimal',
                    min: 0.01,
                    step: 0.01,
                  },
                }}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message ?? ' '}
              />
            )}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={crmStyles.dialogActionsSx}>
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
