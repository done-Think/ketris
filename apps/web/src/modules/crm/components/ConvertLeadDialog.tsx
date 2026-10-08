'use client'

import { useEffect, useState } from 'react'
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
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { brand, iconSize } from '@shared/theme/tokens'

import { useConvertLeadToOpportunity } from '../hooks/use-leads'
import type { ConvertLeadDialogProps } from '../types/lead'
import type { PublicPropertySummary } from '../types/property'
import { errorMessage } from '../utils/error-message'
import { PropertyAutocomplete } from './opportunity-detail/PropertyAutocomplete'

export function ConvertLeadDialog({ lead, onClose, open }: ConvertLeadDialogProps) {
  const t = useTranslations('crm.leads.convert')
  const { enqueueSnackbar } = useSnackbar()
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''
  const convertLead = useConvertLeadToOpportunity(tenantId)
  const [property, setProperty] = useState<PublicPropertySummary | null>(null)
  const [proposedValue, setProposedValue] = useState('')

  useEffect(() => {
    if (!open) return

    setProperty(null)
    setProposedValue('')
  }, [open])

  if (!lead) return null

  const amount = Number(proposedValue)
  const isValueValid = Number.isFinite(amount) && amount > 0
  const canSubmit = Boolean(property) && isValueValid && !convertLead.isPending

  function handleSubmit() {
    if (!property || !isValueValid) return

    convertLead.mutate(
      { leadId: lead!.id, payload: { propertyId: property.id, proposedValue: amount } },
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
          <PropertyAutocomplete tenantId={tenantId} value={property} onChange={setProperty} />
          <TextField
            label={t('proposedValue')}
            type="number"
            fullWidth
            value={proposedValue}
            onChange={(event) => setProposedValue(event.target.value)}
            error={Boolean(proposedValue) && !isValueValid}
            helperText={Boolean(proposedValue) && !isValueValid ? t('proposedValueInvalid') : ' '}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 }}>
        <Button type="button" variant="outlined" color="secondary" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button type="button" variant="contained" disabled={!canSubmit} onClick={handleSubmit}>
          {t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
