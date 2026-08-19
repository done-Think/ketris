import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material'

import type { OpportunityContactPanelProps } from '../../types/opportunity-detail'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { DetailItem } from './DetailItem'
import { labelSx, panelSx } from './opportunity-detail.styles'

export function OpportunityContactPanel({ opportunity }: OpportunityContactPanelProps) {
  return (
    <Paper component="section" elevation={0} sx={{ ...panelSx, p: { xs: 2, md: 2.5 } }}>
      <Typography component="h2" sx={{ mb: 2.2, fontSize: 16, fontWeight: 800 }}>
        Informações de contato e interesse
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          gap: 2.2,
        }}
      >
        <DetailItem label="E-mail" value={opportunity.interessadoEmail} />
        <DetailItem label="Telefone" value={opportunity.interessadoTelefone ?? 'Não informado'} />
        <DetailItem label="Valor proposto" value={formatCurrency(opportunity.valorProposto)} />
        <DetailItem
          label="Prazo de contrato"
          value={
            opportunity.prazoContratoMeses
              ? `${opportunity.prazoContratoMeses} meses`
              : 'Não informado'
          }
        />
        <DetailItem
          label="Início pretendido"
          value={
            opportunity.inicioPretendido
              ? formatDate(opportunity.inicioPretendido)
              : 'Não informado'
          }
        />
        <DetailItem
          label="Garantia"
          value={
            opportunity.garantiaContratual === 'NENHUMA'
              ? 'Não informada'
              : opportunity.garantiaContratual.replace('_', ' ')
          }
        />
      </Box>
      {(opportunity.condicoesEspeciais.length > 0 || opportunity.observacoes) && (
        <>
          <Divider sx={{ my: 2.2 }} />
          {opportunity.condicoesEspeciais.length > 0 && (
            <Box sx={{ mb: opportunity.observacoes ? 2 : 0 }}>
              <Typography sx={labelSx}>Condições especiais</Typography>
              <Stack direction="row" gap={0.7} flexWrap="wrap" sx={{ mt: 0.8 }}>
                {opportunity.condicoesEspeciais.map((condition) => (
                  <Chip key={condition} label={condition} size="small" variant="outlined" />
                ))}
              </Stack>
            </Box>
          )}
          {opportunity.observacoes && (
            <DetailItem label="Observações" value={opportunity.observacoes} />
          )}
        </>
      )}
    </Paper>
  )
}
