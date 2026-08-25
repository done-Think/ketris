import { useEffect } from 'react'
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
  TextField,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

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
  }, [lead, reset])

  function onSubmit(values: DashboardLeadDetailsFormValues) {
    if (!lead) return

    onLeadUpdate(lead.name, values)
    onClose()
  }

  return (
    <Dialog
      open={Boolean(lead)}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: `${radius.sm}px`,
          overflow: 'hidden',
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
                  Detalhes do lead
                </Typography>
                <Typography
                  noWrap
                  sx={{ color: brand.graphite[500], fontSize: { xs: 20, md: 24 }, fontWeight: 900 }}
                >
                  {lead.name}
                </Typography>
              </Box>
              <IconButton aria-label="Fechar" onClick={onClose} size="small">
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
              <ContactInfoCard label="Cliente" name={lead.name} phone={lead.phone} />
              <LeadBriefingItem label="Interesse" value={lead.interest} />
              <LeadBriefingItem label="Origem" value={lead.origin} />
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
              <Controller
                control={control}
                name="reportedNeed"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="O que relatou"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    multiline
                    minRows={3}
                    fullWidth
                  />
                )}
              />
              <Controller
                control={control}
                name="lookingFor"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="O que procura"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    multiline
                    minRows={3}
                    fullWidth
                  />
                )}
              />
              <Controller
                control={control}
                name="budgetRange"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Base de valores"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                control={control}
                name="downPayment"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Valor de entrada"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                control={control}
                name="financingStatus"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Financiamento"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    multiline
                    minRows={2}
                    fullWidth
                  />
                )}
              />
              <Controller
                control={control}
                name="timeline"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Prazo de decisão"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    multiline
                    minRows={2}
                    fullWidth
                  />
                )}
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
                Regiões de busca
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

            <Controller
              control={control}
              name="notes"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Observações para atendimento"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  multiline
                  minRows={3}
                  fullWidth
                  sx={{ mt: 1 }}
                />
              )}
            />
          </DialogContent>

          <DialogActions sx={{ px: { xs: 2, md: 2.6 }, pb: 2.6, pt: 0 }}>
            <Button onClick={onClose} sx={{ color: brand.neutral[500], fontWeight: 800 }}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="lead-details-form"
              variant="contained"
              sx={{ fontWeight: 900 }}
            >
              Salvar
            </Button>
          </DialogActions>
        </>
      ) : null}
    </Dialog>
  )
}
