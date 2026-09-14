import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import { Box, Paper, Stack, Typography } from '@mui/material'

import { brand, iconSize } from '@shared/theme/tokens'

import type { ProposalInformationPanelProps } from '../../types/proposal-management'
import {
  proposalDetailLabelSx,
  proposalDetailValueSx,
  proposalPanelHeaderSx,
  proposalPanelSx,
  proposalPanelTitleSx,
} from './proposal-detail.styles'

export function ProposalInformationPanel({ detail }: ProposalInformationPanelProps) {
  const proposalDetails = [
    { label: 'Valor proposto', value: detail.proposal.valueLabel },
    { label: 'Prazo do contrato', value: detail.contractTermLabel },
    { label: 'Início pretendido', value: detail.intendedStartDateLabel },
    { label: 'Garantia contratual', value: detail.guaranteeLabel },
  ]

  return (
    <Paper
      component="section"
      aria-labelledby="proposal-information-title"
      elevation={0}
      sx={{ ...proposalPanelSx, minHeight: { sm: 212 }, p: { xs: 2, sm: 2.5 } }}
    >
      <Stack direction="row" alignItems="center" gap={1} sx={proposalPanelHeaderSx}>
        <DescriptionOutlinedIcon
          aria-hidden="true"
          sx={{ color: brand.magenta[500], fontSize: iconSize.sm }}
        />
        <Typography id="proposal-information-title" component="h2" sx={proposalPanelTitleSx}>
          Detalhes da Proposta
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' },
          columnGap: 4,
          rowGap: 1.5,
          mt: 2,
        }}
      >
        {proposalDetails.map(({ label, value }) => (
          <Box key={label} sx={{ minWidth: 0 }}>
            <Typography sx={proposalDetailLabelSx}>{label}</Typography>
            <Typography sx={{ ...proposalDetailValueSx, mt: 0.2 }}>{value}</Typography>
          </Box>
        ))}
        <Box sx={{ minWidth: 0, gridColumn: { sm: '1 / -1' } }}>
          <Typography sx={proposalDetailLabelSx}>Observações</Typography>
          <Typography
            sx={{
              mt: 0.35,
              color: brand.graphite[500],
              fontSize: 12,
              fontWeight: 400,
              lineHeight: 1.5,
            }}
          >
            {detail.observations}
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
}
