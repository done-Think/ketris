import { useEffect, useState, type MouseEvent } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'

import { RhfTextField } from '@shared/components/form'
import { alpha, brand, radius } from '@shared/theme/tokens'

import { dashboardLeadDetailsSchema } from '../schemas/dashboard-lead-details-schema'
import type {
  DashboardLeadDetailsFormValues,
  LeadBriefingItemProps,
  LeadDetailsModalProps,
} from '../types/dashboard-overview'
import { ContactInfoCard } from './ContactInfoCard'

function LeadBriefingItem({ label, value }: LeadBriefingItemProps) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: alpha.graphite[6],
        borderRadius: `${radius.sm}px`,
        p: 1.4,
      }}
    >
      <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}>
        {label}
      </Typography>
      <Typography sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 800, mt: 0.6 }}>
        {value}
      </Typography>
    </Box>
  )
}

export function LeadDetailsModal({ lead, onClose, onLeadUpdate }: LeadDetailsModalProps) {
  const t = useTranslations('dashboard.overview.leadDetails')
  const [isEditing, setIsEditing] = useState(false)
  const { control, handleSubmit, reset } = useForm<DashboardLeadDetailsFormValues>({
    defaultValues: {
      reportedNeed: '',
      lookingFor: '',
      budgetRange: '',
      downPayment: '',
      financingStatus: '',
      timeline: '',
      notes: '',
    },
    resolver: zodResolver(dashboardLeadDetailsSchema),
  })

  useEffect(() => {
    if (!lead) return

    reset({
      reportedNeed: lead.reportedNeed,
      lookingFor: lead.lookingFor,
      budgetRange: lead.budgetRange,
      downPayment: lead.downPayment,
      financingStatus: lead.financingStatus,
      timeline: lead.timeline,
      notes: lead.notes,
    })
    setIsEditing(false)
  }, [lead, reset])

  function onSubmit(values: DashboardLeadDetailsFormValues) {
    if (!lead) return

    onLeadUpdate(lead.id, values)
    setIsEditing(false)
    onClose()
  }

  function startEditing(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    setIsEditing(true)
  }

  function closeModal(_: object, reason: 'backdropClick' | 'escapeKeyDown') {
    if (reason === 'backdropClick') return

    onClose()
  }

  return (
    <Dialog
      open={Boolean(lead)}
      onClose={closeModal}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${radius.sm}px`,
            overflow: 'hidden',
          },
        },
      }}
    >
      {lead ? (
        <>
          <DialogTitle sx={{ px: { xs: 2, md: 2.6 }, py: 2 }}>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={2}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}>
                  {t('title')}
                </Typography>
                <Typography
                  noWrap
                  sx={{ color: brand.graphite[500], fontSize: { xs: 20, md: 24 }, fontWeight: 900 }}
                >
                  {lead.name}
                </Typography>
              </Box>
              <IconButton aria-label={t('close')} onClick={onClose} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ px: { xs: 2, md: 2.6 }, pb: 1.6 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                gap: 1,
              }}
            >
              <ContactInfoCard label={t('client')} name={lead.name} phone={lead.phone} />
              <LeadBriefingItem label={t('interest')} value={lead.interest} />
              <LeadBriefingItem label={t('origin')} value={lead.origin} />
            </Box>

            <Box
              component="form"
              id="lead-details-form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 1,
                mt: 1,
              }}
            >
              <RhfTextField
                control={control}
                name="reportedNeed"
                label={t('fields.reportedNeed')}
                multiline
                minRows={3}
                disabled={!isEditing}
                fullWidth
              />
              <RhfTextField
                control={control}
                name="lookingFor"
                label={t('fields.lookingFor')}
                multiline
                minRows={3}
                disabled={!isEditing}
                fullWidth
              />
              <RhfTextField
                control={control}
                name="budgetRange"
                label={t('fields.budgetRange')}
                disabled={!isEditing}
                fullWidth
              />
              <RhfTextField
                control={control}
                name="downPayment"
                label={t('fields.downPayment')}
                disabled={!isEditing}
                fullWidth
              />
              <RhfTextField
                control={control}
                name="financingStatus"
                label={t('fields.financingStatus')}
                multiline
                minRows={2}
                disabled={!isEditing}
                fullWidth
              />
              <RhfTextField
                control={control}
                name="timeline"
                label={t('fields.timeline')}
                multiline
                minRows={2}
                disabled={!isEditing}
                fullWidth
              />
            </Box>

            <Box
              sx={{
                border: '1px solid',
                borderColor: alpha.graphite[6],
                borderRadius: `${radius.sm}px`,
                p: 1.4,
                mt: 1,
              }}
            >
              <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}>
                {t('desiredRegions')}
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                {lead.desiredRegions.map((region) => (
                  <Chip
                    key={region}
                    label={region}
                    size="small"
                    sx={{
                      bgcolor: brand.magenta[50],
                      color: brand.magenta[600],
                      fontSize: 11,
                      fontWeight: 900,
                    }}
                  />
                ))}
              </Stack>
            </Box>

            <RhfTextField
              control={control}
              name="notes"
              label={t('fields.notes')}
              multiline
              minRows={3}
              disabled={!isEditing}
              fullWidth
              sx={{ mt: 1 }}
            />
          </DialogContent>

          <DialogActions sx={{ px: { xs: 2, md: 2.6 }, pb: 2.6, pt: 0 }}>
            <Button onClick={onClose} sx={{ color: brand.neutral[500], fontWeight: 800 }}>
              {t('cancel')}
            </Button>
            {isEditing ? (
              <Button
                type="submit"
                form="lead-details-form"
                variant="contained"
                sx={{ fontWeight: 900 }}
              >
                {t('save')}
              </Button>
            ) : (
              <Button
                type="button"
                variant="contained"
                onClick={startEditing}
                sx={{ fontWeight: 900 }}
              >
                {t('edit')}
              </Button>
            )}
          </DialogActions>
        </>
      ) : null}
    </Dialog>
  )
}
