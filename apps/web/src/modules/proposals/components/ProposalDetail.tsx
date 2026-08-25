'use client'

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Box, Button, Stack, Typography } from '@mui/material'
import NextLink from 'next/link'

import { brand, radius, surface } from '@shared/theme/tokens'

import { getProposalManagementDetail } from '../fixtures/proposal-management-fixtures'
import type { ProposalDetailProps } from '../types/proposal-management'
import { ProposalBindingPanel } from './proposal-detail/ProposalBindingPanel'
import { ProposalDetailHeader } from './proposal-detail/ProposalDetailHeader'
import { ProposalHistoryPanel } from './proposal-detail/ProposalHistoryPanel'
import { ProposalInformationPanel } from './proposal-detail/ProposalInformationPanel'
import { ProposalSpecialConditionsPanel } from './proposal-detail/ProposalSpecialConditionsPanel'

export function ProposalDetail({ proposalId, onEdit, onSendToOwner }: ProposalDetailProps) {
  const detail = getProposalManagementDetail(proposalId)

  if (!detail) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={2}
        sx={{ minHeight: '100vh', p: 3, bgcolor: surface.app, textAlign: 'center' }}
      >
        <Typography component="h1" sx={{ fontSize: 24, fontWeight: 800 }}>
          Proposta não encontrada
        </Typography>
        <Typography sx={{ color: brand.neutral[500], fontSize: 13 }}>
          Verifique o endereço ou retorne para a lista de propostas.
        </Typography>
        <Button
          component={NextLink}
          href="/crm/proposals"
          variant="outlined"
          startIcon={<ArrowBackRoundedIcon />}
          sx={{ borderRadius: `${radius.sm}px`, fontWeight: 700 }}
        >
          Voltar para propostas
        </Button>
      </Stack>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        px: { xs: 2, sm: 3, lg: 3.5 },
        py: { xs: 2, sm: 3, lg: 3.5 },
        bgcolor: surface.app,
      }}
    >
      <ProposalDetailHeader detail={detail} onEdit={onEdit} onSendToOwner={onSendToOwner} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: 'minmax(0, 61.5fr) minmax(280px, 38.5fr)',
          },
          gap: { xs: 2, sm: 2.5 },
          alignItems: 'start',
          mt: { xs: 2, sm: 2.5 },
        }}
      >
        <Stack spacing={{ xs: 2, sm: 2.5 }} sx={{ minWidth: 0 }}>
          <ProposalInformationPanel detail={detail} />
          <ProposalSpecialConditionsPanel conditions={detail.specialConditions} />
        </Stack>

        <Stack spacing={{ xs: 2, sm: 2.5 }} sx={{ minWidth: 0 }}>
          <ProposalBindingPanel
            lead={detail.proposal.lead}
            property={detail.proposal.property}
            broker={detail.broker}
          />
          <ProposalHistoryPanel entries={detail.history} />
        </Stack>
      </Box>
    </Box>
  )
}
