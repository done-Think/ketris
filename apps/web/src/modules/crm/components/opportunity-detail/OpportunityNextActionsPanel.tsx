import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import { Paper, Stack, Typography } from '@mui/material'

import { radius, surface } from '@shared/theme/tokens'

import { panelSx } from './opportunity-detail.styles'

export function OpportunityNextActionsPanel() {
  return (
    <Paper component="section" elevation={0} sx={{ ...panelSx, p: { xs: 2, md: 2.5 } }}>
      <Typography component="h2" sx={{ mb: 1.4, fontSize: 16, fontWeight: 800 }}>
        Próximas ações
      </Typography>
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={1}
        sx={{ minHeight: 120, p: 2, borderRadius: `${radius.sm}px`, bgcolor: surface.app }}
      >
        <CalendarMonthOutlinedIcon sx={{ color: 'text.disabled' }} />
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
          Nenhuma próxima ação cadastrada
        </Typography>
      </Stack>
    </Paper>
  )
}
