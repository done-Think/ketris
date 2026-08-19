import { Box, Chip, Stack, Typography } from '@mui/material'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { agendaEvents } from '../data/agenda-events'
import type { AgendaEventStatus } from '../types/agenda-event'

const eventStatusStyles: Record<AgendaEventStatus, { bgcolor: string; color: string }> = {
  Confirmada: { bgcolor: alpha.magenta[10], color: brand.magenta[700] },
  Pendente: { bgcolor: alpha.graphite[6], color: brand.graphite[500] },
  Reagendar: { bgcolor: alpha.error[10], color: brand.semantic.error },
}

export function AgendaDashboardPage() {
  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
      <Stack spacing={2.4}>
        <Box>
          <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 900 }}>
            Agenda
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: { xs: 15, md: 17 } }}>
            Compromissos comerciais, visitas e retornos.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
            gap: 1.6,
          }}
        >
          {agendaEvents.map((event) => {
            const status = eventStatusStyles[event.status]

            return (
              <Box
                key={event.id}
                sx={{
                  bgcolor: surface.paper,
                  border: '1px solid',
                  borderColor: alpha.graphite[6],
                  borderRadius: `${radius.sm}px`,
                  boxShadow: shadows.propertyCard,
                  p: 2.4,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Typography sx={{ color: brand.magenta[600], fontWeight: 900 }}>
                    {event.time}
                  </Typography>
                  <Chip
                    label={event.status}
                    size="small"
                    sx={{
                      bgcolor: status.bgcolor,
                      color: status.color,
                      borderRadius: `${radius.full}px`,
                      fontWeight: 900,
                    }}
                  />
                </Stack>
                <Typography sx={{ mt: 2, fontSize: 20, fontWeight: 900 }}>{event.title}</Typography>
                <Typography sx={{ mt: 0.8, color: 'text.secondary' }}>{event.property}</Typography>
                <Typography sx={{ mt: 1.5, fontWeight: 800 }}>{event.participant}</Typography>
              </Box>
            )
          })}
        </Box>
      </Stack>
    </Box>
  )
}
