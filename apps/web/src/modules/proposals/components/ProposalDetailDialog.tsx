'use client'

import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { brand, radius, surface } from '@shared/theme/tokens'

import { proposalStatusStyles } from '../config/proposal-status-styles'
import { proposalStatusSchema } from '../schemas/proposal-status-schema'
import type {
  ProposalDetailDialogProps,
  ProposalStatus,
  ProposalStatusFormValues,
} from '../types/proposal'

const proposalStatusOptions: ProposalStatus[] = ['underReview', 'counteroffer', 'approved']

export function ProposalDetailDialog({
  onClose,
  onStatusChange,
  open,
  proposal,
}: ProposalDetailDialogProps) {
  const t = useTranslations('dashboard.proposals')
  const { control, handleSubmit, reset } = useForm<ProposalStatusFormValues>({
    defaultValues: { status: proposal?.status ?? 'underReview' },
    resolver: zodResolver(proposalStatusSchema),
  })

  useEffect(() => {
    reset({ status: proposal?.status ?? 'underReview' })
  }, [proposal?.status, reset])

  if (!proposal) return null

  const status = proposalStatusStyles[proposal.status]
  const submitStatusChange = (values: ProposalStatusFormValues) => {
    onStatusChange(proposal.id, values.status)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit(submitStatusChange)}>
        <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.2, pt: 2.4 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: brand.magenta[600], fontSize: 13, fontWeight: 900 }}>
                {t('detail.eyebrow')}
              </Typography>
              <Typography sx={{ color: brand.graphite[500], fontSize: 22, fontWeight: 900 }}>
                {proposal.client}
              </Typography>
              <Typography sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}>
                {proposal.property}
              </Typography>
            </Box>
            <IconButton aria-label={t('detail.close')} onClick={onClose}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 2, md: 2.8 }, pb: 2.2 }}>
          <Box
            sx={{
              bgcolor: surface.app,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: `${radius.sm}px`,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.4,
              p: 1.6,
            }}
          >
            <Box>
              <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 800 }}>
                {t('detail.value')}
              </Typography>
              <Typography sx={{ color: brand.graphite[500], fontSize: 15, fontWeight: 900 }}>
                {proposal.value}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 800 }}>
                {t('detail.ownerExpectation')}
              </Typography>
              <Typography sx={{ color: brand.graphite[500], fontSize: 15, fontWeight: 900 }}>
                {proposal.ownerExpectation}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 800 }}>
                {t('detail.currentStatus')}
              </Typography>
              <Chip
                label={t(`statuses.${proposal.status}`)}
                sx={{
                  bgcolor: status.bgcolor,
                  color: status.color,
                  borderRadius: `${radius.full}px`,
                  fontWeight: 900,
                  mt: 0.6,
                }}
              />
            </Box>
            <Controller
              control={control}
              name="status"
              render={({ field, fieldState }) => (
                <FormControl fullWidth error={Boolean(fieldState.error)}>
                  <InputLabel id="proposal-status-label">{t('detail.status')}</InputLabel>
                  <Select
                    {...field}
                    labelId="proposal-status-label"
                    label={t('detail.status')}
                    sx={{ borderRadius: `${radius.sm}px` }}
                  >
                    {proposalStatusOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {t(`statuses.${option}`)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, md: 2.8 }, pb: 2.6, pt: 0 }}>
          <Button type="button" variant="outlined" color="secondary" onClick={onClose}>
            {t('detail.cancel')}
          </Button>
          <Button type="submit" variant="contained">
            {t('detail.saveStatus')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
