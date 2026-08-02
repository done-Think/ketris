import { Box, Container, Typography } from '@mui/material'
import Link from 'next/link'

import { gradients, radius, surface } from '@shared/theme/tokens'

import { miniProperties } from '../data/mini-properties'

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
            fontSize: 12,
            fontWeight: 800,
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
            <Box
              component={Link}
              href="/imoveis"
              key={property.title}
              sx={{
                overflow: 'hidden',
                borderRadius: `${radius.sm}px`,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: surface.app,
                color: 'inherit',
                textDecoration: 'none',
                transition: 'border-color 180ms ease, transform 180ms ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Box
                sx={{
                  height: { xs: 64, sm: 74 },
                  backgroundImage: gradients.miniPropertyImage(property.image),
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <Box sx={{ px: 1.2, py: 1 }}>
                <Typography
                  sx={{
                    color: 'text.primary',
                    fontSize: 11,
                    fontWeight: 900,
                    lineHeight: 1.25,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {property.title}
                </Typography>
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: 10,
                    fontWeight: 700,
                    mt: 0.25,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {property.location}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  )
}
