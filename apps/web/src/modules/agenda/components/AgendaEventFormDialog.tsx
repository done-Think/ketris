'use client'

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
  Stack,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { brand, iconSize } from '@shared/theme/tokens'

import { agendaEventFormSchema } from '../schemas/agenda-event-form-schema'
import type { AgendaEventFormDialogProps, AgendaEventFormValues } from '../types/agenda-event'
import { AgendaEventFormFields } from './AgendaEventFormFields'

function buildDefaultValues(minDate: string): AgendaEventFormValues {
  return {
    customProperty: '',
    durationMinutes: 60,
    kind: '',
    notes: '',
    participant: '',
    phone: '',
    propertyId: '',
    scheduledDate: minDate,
    scheduledTime: '09:00',
    title: '',
  }
}

export function AgendaEventFormDialog({
  maxDate,
  minDate,
  onClose,
  onCreate,
  open,
  propertyOptions,
}: AgendaEventFormDialogProps) {
  const t = useTranslations('agenda.eventForm')
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<AgendaEventFormValues>({
    defaultValues: buildDefaultValues(minDate),
    resolver: zodResolver(agendaEventFormSchema),
  })

  useEffect(() => {
    if (!open) return

    reset(buildDefaultValues(minDate))
  }, [minDate, open, reset])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit(onCreate)}>
        <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: brand.magenta[600], fontSize: 13, fontWeight: 900 }}>
                {t('eyebrow')}
              </Typography>
              <Typography sx={{ color: brand.graphite[500], fontSize: 22, fontWeight: 900 }}>
                {t('title')}
              </Typography>
            </Box>
            <IconButton aria-label={t('closeAriaLabel')} onClick={onClose}>
              <CloseRoundedIcon sx={{ fontSize: iconSize.lg }} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 2, md: 2.8 }, pb: 2 }}>
          <AgendaEventFormFields
            control={control}
            maxDate={maxDate}
            minDate={minDate}
            propertyOptions={propertyOptions}
          />
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 }}>
          <Button type="button" variant="outlined" color="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<AddRoundedIcon />}
            disabled={isSubmitting}
          >
            {t('submit')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
