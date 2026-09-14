import { Box, Chip, Stack, Typography } from '@mui/material'

import { alpha, brand, motion, radius, shadows, surface } from '@shared/theme/tokens'

import { dashboardLeads } from '../data/leads'
import type { LeadStage } from '../types/lead'

const leadStageStyles: Record<LeadStage, { bgcolor: string; color: string }> = {
  Novo: { bgcolor: alpha.magenta[10], color: brand.magenta[700] },
  'Em contato': { bgcolor: alpha.graphite[6], color: brand.graphite[500] },
  'Visita marcada': { bgcolor: alpha.magenta[6], color: brand.magenta[600] },
  Proposta: { bgcolor: alpha.graphite[8], color: brand.graphite[700] },
}

export function LeadsDashboardPage() {
  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
      <Stack spacing={2.4}>
        <Box>
          <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 900 }}>
            Leads
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: { xs: 15, md: 17 } }}>
            Base inicial para acompanhar contatos e oportunidades.
          </Typography>
        </Box>

        <Box
          sx={{
            bgcolor: surface.paper,
            border: '1px solid',
            borderColor: alpha.graphite[6],
            borderRadius: `${radius.sm}px`,
            boxShadow: shadows.propertyCard,
            overflow: 'hidden',
          }}
        >
          {dashboardLeads.map((lead) => {
            const stage = leadStageStyles[lead.stage]

            return (
              <Box
                key={lead.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1.3fr 1.8fr 0.8fr 1fr 0.9fr' },
                  gap: 1.4,
                  alignItems: 'center',
                  px: 2.4,
                  py: 1.8,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  transition: motion.transition.interactive,
                  '&:hover': { bgcolor: brand.neutral[50] },
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>{lead.name}</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                    {lead.lastContact}
                  </Typography>
                </Box>
                <Typography sx={{ color: 'text.secondary' }}>{lead.interest}</Typography>
                <Typography sx={{ fontWeight: 800 }}>{lead.source}</Typography>
                <Typography sx={{ color: 'text.secondary' }}>{lead.broker}</Typography>
                <Chip
                  label={lead.stage}
                  sx={{
                    justifySelf: { md: 'end' },
                    width: 'fit-content',
                    bgcolor: stage.bgcolor,
                    color: stage.color,
                    borderRadius: `${radius.full}px`,
                    fontWeight: 900,
                  }}
                />
              </Box>
            )
          })}
        </Box>
      </Stack>
    </Box>
  )
}
