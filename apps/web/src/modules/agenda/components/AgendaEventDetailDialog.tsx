'use client'

import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Link } from '@/i18n/navigation'
import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'
import type { LocalizedHref } from '@shared/types/localized-href'

import {
  agendaOtherPropertyValue,
  agendaEventFormSchema,
} from '../schemas/agenda-event-form-schema'
import type {
  AgendaEvent,
  AgendaEventDetailDialogProps,
  AgendaEventFormValues,
} from '../types/agenda-event'
import { AgendaEventFormFields } from './AgendaEventFormFields'
import { CancelAgendaEventDialog } from './CancelAgendaEventDialog'

function buildEditFormValues(event: AgendaEvent): AgendaEventFormValues {
  const hasKnownProperty = Boolean(event.propertyId)

  return {
    customProperty: hasKnownProperty ? '' : event.property,
    durationMinutes: event.durationMinutes,
    kind: event.apiKind ?? '',
    notes: event.notes,
    participant: event.participant,
    phone: event.phone,
    propertyId: hasKnownProperty ? (event.propertyId as string) : agendaOtherPropertyValue,
    scheduledDate: event.scheduledDate,
    scheduledTime: event.time,
    title: event.title,
  }
}

export function AgendaEventDetailDialog({
  event,
  isDeleting,
  isSaving,
  maxDate,
  minDate,
  onClose,
  onDelete,
  onEdit,
  open,
  propertyOptions,
}: AgendaEventDetailDialogProps) {
  const locale = useLocale()
  const t = useTranslations('agenda.eventDetail')
  const agendaT = useTranslations('agenda.dashboard')
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { control, handleSubmit, reset } = useForm<AgendaEventFormValues>({
    defaultValues: event ? buildEditFormValues(event) : undefined,
    resolver: zodResolver(agendaEventFormSchema),
  })

  const closeDialog = () => {
    setMode('view')
    onClose()
  }

  const startEditing = () => {
    if (!event) return

    reset(buildEditFormValues(event))
    setMode('edit')
  }

  const cancelEditing = () => setMode('view')

  const submitEdit = async (values: AgendaEventFormValues) => {
    const success = await onEdit(values)
    if (success) setMode('view')
  }

  const confirmDelete = async () => {
    const success = await onDelete()
    setIsDeleteDialogOpen(false)
    if (success) closeDialog()
  }

  if (!event) return null

  const formattedEventDate = new Intl.DateTimeFormat(locale).format(
    new Date(`${event.scheduledDate}T00:00:00`),
  )

  return (
    <>
      <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSubmit(submitEdit)}>
          <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 }}>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={2}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: brand.magenta[600], fontSize: 13, fontWeight: 900 }}>
                  {event.time} · {formattedEventDate}
                </Typography>
                <Typography sx={{ color: brand.graphite[500], fontSize: 22, fontWeight: 900 }}>
                  {mode === 'edit' ? t('editTitle') : event.title}
                </Typography>
              </Box>
              <IconButton aria-label={t('closeAriaLabel')} onClick={closeDialog}>
                <CloseRoundedIcon sx={{ fontSize: iconSize.lg }} />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ px: { xs: 2, md: 2.8 }, pb: 2 }}>
            {mode === 'edit' ? (
              <AgendaEventFormFields
                control={control}
                maxDate={maxDate}
                minDate={minDate}
                propertyOptions={propertyOptions}
              />
            ) : (
              <Stack spacing={2}>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: alpha.graphite[8],
                    borderRadius: `${radius.sm}px`,
                    bgcolor: surface.app,
                    p: 1.6,
                  }}
                >
                  <Stack spacing={1.3}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <HomeWorkOutlinedIcon
                        sx={{ color: brand.magenta[500], fontSize: iconSize.md }}
                      />
                      {event.property ? (
                        <MuiLink
                          component={Link}
                          href={event.propertyHref as LocalizedHref}
                          underline="hover"
                          sx={{ color: brand.graphite[500], fontSize: 15, fontWeight: 900 }}
                        >
                          {event.property}
                        </MuiLink>
                      ) : (
                        <Typography
                          sx={{ color: brand.neutral[500], fontSize: 15, fontWeight: 700 }}
                        >
                          {t('noProperty')}
                        </Typography>
                      )}
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PhoneOutlinedIcon
                        sx={{ color: brand.neutral[500], fontSize: iconSize.md }}
                      />
                      <Typography
                        sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 800 }}
                      >
                        {event.participant} · {event.phone}
                      </Typography>
                    </Stack>
                    {event.createdBy && event.createdByRole ? (
                      <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
                        {t('createdBy', {
                          name: event.createdBy,
                          role: agendaT(`creatorRoles.${event.createdByRole}`),
                        })}
                      </Typography>
                    ) : null}
                  </Stack>
                </Box>

                <Box>
                  <Typography
                    sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 900, mb: 0.8 }}
                  >
                    {t('notesTitle')}
                  </Typography>
                  <Typography sx={{ color: brand.neutral[500], fontSize: 14, lineHeight: 1.65 }}>
                    {event.notes}
                  </Typography>
                </Box>
              </Stack>
            )}
          </DialogContent>

          <DialogActions sx={{ px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 }}>
            {mode === 'edit' ? (
              <>
                <Button type="button" variant="outlined" color="secondary" onClick={cancelEditing}>
                  {t('cancelEdit')}
                </Button>
                <Button type="submit" variant="contained" disabled={isSaving}>
                  {isSaving ? <CircularProgress size={20} /> : t('save')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: iconSize.sm }} />}
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  {t('delete')}
                </Button>
                <Button
                  type="button"
                  variant="contained"
                  startIcon={<EditRoundedIcon sx={{ fontSize: iconSize.sm }} />}
                  onClick={startEditing}
                >
                  {t('edit')}
                </Button>
              </>
            )}
          </DialogActions>
        </Box>
      </Dialog>

      <CancelAgendaEventDialog
        open={isDeleteDialogOpen}
        isPending={isDeleting}
        title={event.title}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
      />
    </>
  )
}
