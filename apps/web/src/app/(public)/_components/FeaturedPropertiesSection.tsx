import {
  Avatar,
  Box,
  Card,
  CardContent,
  Container,
  Divider,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import NorthEastOutlinedIcon from '@mui/icons-material/NorthEastOutlined'
import Link from 'next/link'

import { detailIcons, featuredProperties } from './_homeData'

export function FeaturedPropertiesSection() {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        zIndex: 2,
        bgcolor: '#F7F8FA',
        pt: { xs: 2, md: 3 },
        pb: { xs: 5, md: 7 },
      }}
    >
      <Container maxWidth="xl">
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mt: '12px', mb: 3 }}
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
              fontSize: 13,
              fontWeight: 800,
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
            gap: 3,
          }}
        >
          {featuredProperties.map((property) => (
            <Card
              component={Link}
              href={property.href}
              key={property.title}
              sx={{
                overflow: 'hidden',
                borderRadius: '8px',
                color: 'inherit',
                textDecoration: 'none',
                boxShadow: '0 16px 44px rgba(33,38,49,0.08)',
                transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
                '&:hover': {
                  boxShadow: '0 24px 58px rgba(33,38,49,0.16)',
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  height: 175,
                  backgroundImage: `url("${property.image}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 14,
                    left: 14,
                    bgcolor: '#FFFFFF',
                    borderRadius: 999,
                    px: 1.2,
                    py: 0.35,
                    color: 'text.primary',
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  Novo
                </Box>
              </Box>
              <CardContent sx={{ p: 2.4 }}>
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: 0,
                    textTransform: 'uppercase',
                    mb: 0.6,
                  }}
                >
                  {property.location}
                </Typography>
                <Typography sx={{ fontSize: 17, fontWeight: 900, lineHeight: 1.25, mb: 1 }}>
                  {property.title}
                </Typography>
                <Typography color="primary" sx={{ fontSize: 20, fontWeight: 900, mb: 1.5 }}>
                  {property.price}
                </Typography>
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                  {property.details.map((detail, index) => {
                    const Icon = detailIcons[index] ?? ApartmentOutlinedIcon
                    return (
                      <Stack key={detail} direction="row" alignItems="center" spacing={0.4}>
                        <Icon sx={{ color: 'text.secondary', fontSize: 15 }} />
                        <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                          {detail}
                        </Typography>
                      </Stack>
                    )
                  })}
                </Stack>
                <Divider sx={{ mb: 1.6 }} />
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                      src={property.avatar}
                      alt={property.broker}
                      sx={{ width: 30, height: 30 }}
                    />
                    <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
                      {property.broker}
                    </Typography>
                  </Stack>
                  <Typography sx={{ color: 'primary.main', fontSize: 12, fontWeight: 900 }}>
                    Ver detalhes
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  )
}
