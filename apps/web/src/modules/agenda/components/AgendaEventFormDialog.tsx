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
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { RhfMaskedTextField, RhfTextField } from '@shared/components/form'
import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

import {
  agendaEventFormSchema,
  agendaOtherPropertyValue,
} from '../schemas/agenda-reschedule-schema'
import type { AgendaEventFormDialogProps, AgendaEventFormValues } from '../types/agenda-event'

const phoneMask = [{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }]

export function AgendaEventFormDialog({
  maxDate,
  minDate,
  onClose,
  onCreate,
  open,
  propertyOptions,
}: AgendaEventFormDialogProps) {
  const { control, handleSubmit, reset } = useForm<AgendaEventFormValues>({
    defaultValues: {
      customProperty: '',
      durationMinutes: 60,
      notes: '',
      participant: '',
      phone: '',
      propertyId: '',
      scheduledDate: minDate,
      scheduledTime: '09:00',
      title: '',
    },
    resolver: zodResolver(agendaEventFormSchema),
  })
  const selectedPropertyId = useWatch({ control, name: 'propertyId' })
  const showCustomPropertyField = selectedPropertyId === agendaOtherPropertyValue

  useEffect(() => {
    if (!open) return

    reset({
      customProperty: '',
      durationMinutes: 60,
      notes: '',
      participant: '',
      phone: '',
      propertyId: '',
      scheduledDate: minDate,
      scheduledTime: '09:00',
      title: '',
    })
  }, [minDate, open, reset])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit(onCreate)}>
        <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: brand.magenta[600], fontSize: 13, fontWeight: 900 }}>
                Novo ponto na agenda
              </Typography>
              <Typography sx={{ color: brand.graphite[500], fontSize: 22, fontWeight: 900 }}>
                Adicionar evento
              </Typography>
            </Box>
            <IconButton aria-label="Fechar novo evento" onClick={onClose}>
              <CloseRoundedIcon sx={{ fontSize: iconSize.lg }} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 2, md: 2.8 }, pb: 2 }}>
          <Stack spacing={1.6}>
            <Box
              sx={{
                border: '1px solid',
                borderColor: alpha.graphite[8],
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.app,
                p: 1.6,
              }}
            >
              <Stack spacing={1.4}>
                <RhfTextField control={control} name="title" label="Título" fullWidth />
                <RhfTextField
                  control={control}
                  name="propertyId"
                  label="Imóvel em questão"
                  select
                  fullWidth
                >
                  {propertyOptions.map((property) => (
                    <MenuItem key={property.id} value={property.id}>
                      {property.label}
                    </MenuItem>
                  ))}
                  <MenuItem value={agendaOtherPropertyValue}>Outro</MenuItem>
                </RhfTextField>
                {showCustomPropertyField ? (
                  <RhfTextField
                    control={control}
                    name="customProperty"
                    label="Imóvel ou referência"
                    fullWidth
                  />
                ) : null}
              </Stack>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.4,
              }}
            >
              <RhfTextField control={control} name="participant" label="Pessoa" fullWidth />
              <RhfMaskedTextField
                control={control}
                name="phone"
                label="Telefone"
                mask={phoneMask}
                fullWidth
              />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 150px 150px' },
                gap: 1.4,
              }}
            >
              <RhfTextField
                control={control}
                name="scheduledDate"
                label="Data"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: maxDate, min: minDate }}
              />
              <RhfTextField
                control={control}
                name="scheduledTime"
                label="Horário"
                type="time"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <RhfTextField
                control={control}
                name="durationMinutes"
                label="Duração"
                type="number"
                fullWidth
                inputProps={{ min: 15, step: 15 }}
              />
            </Box>

            <RhfTextField
              control={control}
              name="notes"
              label="Observações"
              minRows={3}
              multiline
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 }}>
          <Button type="button" variant="outlined" color="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" startIcon={<AddRoundedIcon />}>
            Criar evento
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
