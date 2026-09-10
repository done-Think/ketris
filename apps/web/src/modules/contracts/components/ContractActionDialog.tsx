'use client'

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, surface } from '@shared/theme/tokens'

import { contractActionMockContents, contractStatusStyles } from '../config/contract-ui'
import type {
  ContractActionDialogProps,
  ContractActionSectionProps,
  ContractActionSummaryProps,
} from '../types/contract'

function ContractActionSummary({ contract }: ContractActionSummaryProps) {
  const t = useTranslations('contracts')
  const tStatus = useTranslations('contracts.status')
  const statusStyle = contractStatusStyles[contract.status]

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: alpha.graphite[8],
        borderRadius: `${radius.sm}px`,
        p: 2,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.2}
        sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Stack spacing={0.4} sx={{ minWidth: 0 }}>
          <Typography sx={{ color: brand.graphite[500], fontSize: 16, fontWeight: 900 }}>
            {contract.title}
          </Typography>
          <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 800 }}>
            {contract.code}
          </Typography>
        </Stack>
        <Chip
          label={tStatus(contract.status)}
          size="small"
          sx={{
            bgcolor: statusStyle.bgcolor,
            color: statusStyle.color,
            fontSize: 12,
            fontWeight: 900,
          }}
        />
      </Stack>

      <Divider sx={{ my: 1.6 }} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          gap: 1.4,
        }}
      >
        {[
          { label: t('actionDialog.summaryLabels.property'), value: contract.property },
          { label: t('actionDialog.summaryLabels.owner'), value: contract.owner },
          { label: t('actionDialog.summaryLabels.tenant'), value: contract.tenant },
          { label: t('actionDialog.summaryLabels.amount'), value: contract.amount },
          { label: t('actionDialog.summaryLabels.start'), value: contract.startDate },
          { label: t('actionDialog.summaryLabels.end'), value: contract.endDate },
        ].map((item) => (
          <Stack key={item.label} spacing={0.3} sx={{ minWidth: 0 }}>
            <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}>
              {item.label}
            </Typography>
            <Typography sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 800 }}>
              {item.value}
            </Typography>
          </Stack>
        ))}
      </Box>
    </Box>
  )
}

function ContractActionSection({ section }: ContractActionSectionProps) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: alpha.graphite[8],
        borderRadius: `${radius.sm}px`,
        p: 1.8,
      }}
    >
      <Typography sx={{ mb: 1.4, color: brand.graphite[500], fontSize: 14, fontWeight: 900 }}>
        {section.title}
      </Typography>
      <Stack spacing={1.2}>
        {section.items.map((item) => (
          <Stack key={`${section.title}-${item.label}`} spacing={0.3}>
            <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}>
              {item.label}
            </Typography>
            <Typography sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 800 }}>
              {item.value}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}

export function ContractActionDialog({
  contract,
  action,
  onClose,
  onConfirm,
}: ContractActionDialogProps) {
  const t = useTranslations('contracts.actionDialog')
  const content = action ? contractActionMockContents[action] : null

  return (
    <Dialog open={Boolean(contract && content)} onClose={onClose} fullWidth maxWidth="md">
      {contract && content ? (
        <>
          <DialogTitle sx={{ px: { xs: 2, md: 2.6 }, pb: 1.2, pt: 2.4 }}>
            <Stack spacing={1}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                }}
              >
                <Typography sx={{ color: brand.graphite[500], fontSize: 20, fontWeight: 900 }}>
                  {content.title}
                </Typography>
                <Chip
                  label={content.statusLabel}
                  size="small"
                  sx={{
                    bgcolor: alpha.magenta[8],
                    color: brand.magenta[700],
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                />
              </Stack>
              <Typography sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}>
                {content.description}
              </Typography>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ bgcolor: surface.paper, px: { xs: 2, md: 2.6 }, pb: 2.2 }}>
            <Stack spacing={1.6}>
              <ContractActionSummary contract={contract} />
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  gap: 1.4,
                }}
              >
                {content.sections.map((section) => (
                  <ContractActionSection key={section.title} section={section} />
                ))}
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: { xs: 2, md: 2.6 }, pb: 2.4, pt: 0 }}>
            <Button variant="outlined" onClick={onClose}>
              {t('close')}
            </Button>
            <Button variant="contained" onClick={onConfirm}>
              {content.primaryActionLabel}
            </Button>
          </DialogActions>
        </>
      ) : null}
    </Dialog>
  )
}
