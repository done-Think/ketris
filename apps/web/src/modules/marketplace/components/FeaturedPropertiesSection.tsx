import { Box, Container, Link as MuiLink, Stack, Typography } from '@mui/material'
import NorthEastOutlinedIcon from '@mui/icons-material/NorthEastOutlined'
import Link from 'next/link'

import { PropertyCard } from '@shared/components/ui'
import { surface } from '@shared/theme/tokens'

import { featuredProperties } from '../data/featured-properties'

export function FeaturedPropertiesSection() {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        zIndex: 2,
        bgcolor: surface.app,
        pt: { xs: 1.25, md: 3 },
        pb: { xs: 5, md: 7 },
      }}
    >
      <Container maxWidth="xl">
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mt: { xs: 0.5, md: '12px' }, mb: { xs: 2, md: 3 } }}
        >
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0 }}>
            Imóveis em destaque
          </Typography>
          <MuiLink
            component={Link}
            href="/imoveis"
            underline="none"
            sx={{
              color: 'primary.main',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: 13.5,
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            Ver todos os imóveis
            <NorthEastOutlinedIcon sx={{ fontSize: 15 }} />
          </MuiLink>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: { xs: 2, md: 3 },
          }}
        >
          {featuredProperties.map((property) => (
            <PropertyCard key={property.title} property={property} />
          ))}
        </Box>
      </Container>
    </Box>
  )
}
