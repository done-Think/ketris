import { Box, Container, Typography } from '@mui/material'

import { componentText, surface } from '@shared/theme/tokens'

import { miniProperties } from '../data/mini-properties'
import { MiniPropertyCard } from './MiniPropertyCard'

export function MiniPropertiesSection() {
  return (
    <Box
      component="section"
      sx={{
        bgcolor: surface.paper,
        borderTop: '1px solid',
        borderColor: 'divider',
        py: { xs: 4, md: 5 },
      }}
    >
      <Container maxWidth="xl">
        <Typography
          align="center"
          sx={{
            color: 'text.secondary',
            ...componentText.miniSectionEyebrow,
            mb: 3,
          }}
        >
          +2.500 imóveis qualificados e verificados digitalmente
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              sm: 'repeat(3, minmax(0, 1fr))',
              md: 'repeat(6, minmax(0, 1fr))',
            },
            gap: { xs: 1.2, md: 2 },
            maxWidth: 1020,
            mx: 'auto',
          }}
        >
          {miniProperties.map((property) => (
            <MiniPropertyCard key={property.title} property={property} />
          ))}
        </Box>
      </Container>
    </Box>
  )
}
