import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  IconButton,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined'
import BedOutlinedIcon from '@mui/icons-material/BedOutlined'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import HouseOutlinedIcon from '@mui/icons-material/HouseOutlined'
import LocalParkingOutlinedIcon from '@mui/icons-material/LocalParkingOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import SquareFootOutlinedIcon from '@mui/icons-material/SquareFootOutlined'
import Link from 'next/link'

const categories = [
  { title: 'Apartamentos', count: '1.240 imóveis', href: '/imoveis?categoria=apartamentos' },
  { title: 'Casas Residenciais', count: '850 imóveis', href: '/imoveis?categoria=casas' },
  { title: 'Salas Comerciais', count: '320 imóveis', href: '/imoveis?categoria=comerciais' },
  { title: 'Terrenos e Lotes', count: '190 imóveis', href: '/imoveis?categoria=terrenos' },
  { title: 'Coberturas', count: '80 imóveis', href: '/imoveis?categoria=coberturas' },
  { title: 'Chácaras e Sítios', count: '45 imóveis', href: '/imoveis?categoria=chacaras' },
]

const featuredProperties = [
  {
    href: '/imoveis/apartamento-jardins',
    image:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80',
    location: 'Jardins, São Paulo',
    title: 'Apartamento de alto padrão com vista livre',
    price: 'R$ 4.800 / mês',
    details: ['3 quartos', '2 banhos', '1 vaga', '95m²'],
    broker: 'Marina Costa',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
  },
  {
    href: '/imoveis/studio-vila-madalena',
    image:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80',
    location: 'Vila Madalena, São Paulo',
    title: 'Studio moderno totalmente reformado',
    price: 'R$ 2.900 / mês',
    details: ['1 quarto', '1 banho', '1 vaga', '42m²'],
    broker: 'Thiago Santos',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
  },
  {
    href: '/imoveis/cobertura-itaim-bibi',
    image:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80',
    location: 'Itaim Bibi, São Paulo',
    title: 'Cobertura tríplex com piscina privativa',
    price: 'R$ 12.500 / mês',
    details: ['4 quartos', '5 banhos', '3 vagas', '240m²'],
    broker: 'Juliana Mendes',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  },
]

const detailIcons = [
  BedOutlinedIcon,
  BathtubOutlinedIcon,
  LocalParkingOutlinedIcon,
  SquareFootOutlinedIcon,
]

// Home / marketplace público — renderizada no servidor (SEO).
export default function HomePage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F7F8FA' }}>
      <Box
        component="header"
        sx={{
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Container maxWidth="xl">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ minHeight: 38, gap: 2 }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <HomeOutlinedIcon color="primary" />
              <Typography variant="h6" sx={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Ketris
              </Typography>
            </Stack>

            <Stack
              component="nav"
              direction="row"
              alignItems="center"
              spacing={{ xs: 2, md: 4 }}
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              {['Comprar', 'Alugar', 'Comercial', 'Para Corretores'].map((item) => (
                <MuiLink
                  key={item}
                  component={Link}
                  href="/imoveis"
                  underline="none"
                  sx={{
                    color: item === 'Comprar' ? 'primary.main' : 'text.secondary',
                    fontSize: 13,
                    fontWeight: 700,
                    pb: 0.9,
                    mt: 0.9,
                    borderBottom: item === 'Comprar' ? '2px solid' : '2px solid transparent',
                    borderColor: item === 'Comprar' ? 'primary.main' : 'transparent',
                  }}
                >
                  {item}
                </MuiLink>
              ))}
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Button
                component={Link}
                href="/login"
                variant="outlined"
                color="secondary"
                size="small"
                sx={{
                  borderColor: 'divider',
                  color: 'text.primary',
                  borderRadius: '8px',
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              >
                Anunciar Imóvel
              </Button>
              <IconButton aria-label="notificações" size="small">
                <NotificationsNoneOutlinedIcon fontSize="small" />
              </IconButton>
              <Avatar
                alt="Corretor"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                sx={{ width: 30, height: 30 }}
              />
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Box
        component="section"
        sx={{
          position: 'relative',
          zIndex: 0,
          color: '#FFFFFF',
          minHeight: { xs: 500, md: 455 },
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#0D0F14',
          backgroundImage:
            'linear-gradient(100deg, rgba(13, 15, 20, 0.98) 0%, rgba(13, 15, 20, 0.9) 48%, rgba(83, 9, 50, 0.72) 100%), url("https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=1800&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 720px) minmax(420px, 1fr)' },
              alignItems: 'center',
              gap: { xs: 4, lg: 7 },
              py: { xs: 7, md: 9 },
              isolation: 'isolate',
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <Typography
                variant="h1"
                sx={{
                  maxWidth: 620,
                  color: '#FFFFFF',
                  fontSize: { xs: '2.25rem', md: '3.4rem' },
                  letterSpacing: 0,
                  mb: 2,
                }}
              >
                A infraestrutura digital do mercado imobiliário
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.72)', mb: 4, maxWidth: 670 }}>
                Aluguel e venda de imóveis com tecnologia de ponta, processos ágeis e total
                confiança.
              </Typography>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                alignItems={{ xs: 'stretch', md: 'center' }}
                sx={{
                  bgcolor: '#FFFFFF',
                  borderRadius: '8px',
                  p: 1.3,
                  maxWidth: 660,
                  boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
                }}
              >
                {[
                  ['Localização', 'Jardins, São Paulo'],
                  ['Tipo de imóvel', 'Apartamento'],
                  ['Faixa de preço', 'R$ 2.500 - R$ 6.000'],
                ].map(([label, value], index) => (
                  <Box
                    key={label}
                    sx={{
                      flex: 1,
                      px: { xs: 1, md: 2 },
                      py: 1,
                      borderRight: index < 2 ? { xs: 0, md: '1px solid' } : 0,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      sx={{
                        color: 'text.disabled',
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                      }}
                    >
                      {label}
                    </Typography>
                    <Typography sx={{ color: 'text.primary', fontSize: 13, fontWeight: 800 }}>
                      {value}
                    </Typography>
                  </Box>
                ))}
                <Button
                  component={Link}
                  href="/imoveis"
                  variant="contained"
                  sx={{ minHeight: 47, px: 3.4, borderRadius: '8px' }}
                >
                  Buscar
                </Button>
              </Stack>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1.5, sm: 5 }}
                sx={{ mt: 4 }}
              >
                {[
                  ['2.500+', 'imóveis ativos'],
                  ['180+', 'corretores parceiros'],
                  ['45+', 'cidades atendidas'],
                ].map(([value, label]) => (
                  <Stack key={label} direction="row" alignItems="baseline" spacing={1}>
                    <Typography sx={{ color: 'primary.main', fontSize: 28, fontWeight: 900 }}>
                      {value}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.78)', fontSize: 13 }}>
                      {label}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                display: { xs: 'none', lg: 'flex' },
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 430,
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 780,
                  height: 430,
                  overflow: 'visible',
                  pointerEvents: 'none',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 1168,
                    height: 644,
                    maxWidth: 'none',
                    transform: 'translate(-50%, -50%)',
                    WebkitMaskImage:
                      'radial-gradient(ellipse at center, #000 38%, rgba(0,0,0,0.68) 52%, rgba(0,0,0,0.18) 66%, transparent 78%)',
                    maskImage:
                      'radial-gradient(ellipse at center, #000 38%, rgba(0,0,0,0.68) 52%, rgba(0,0,0,0.18) 66%, transparent 78%)',
                  }}
                >
                  <Box
                    component="video"
                    src="/videologo-chroma.webm"
                    autoPlay
                    muted
                    playsInline
                    aria-hidden="true"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      filter: 'blur(46px)',
                      opacity: 0.72,
                      transform: 'scale(1.12)',
                      transformOrigin: 'center',
                    }}
                  />
                  <Box
                    component="video"
                    src="/videologo-chroma.webm"
                    autoPlay
                    muted
                    playsInline
                    aria-label="Animação da marca Ketris"
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      opacity: 1,
                      transform: 'scale(1)',
                      transformOrigin: 'center',
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box
        component="section"
        sx={{
          position: 'relative',
          zIndex: 2,
          bgcolor: '#FFFFFF',
          pt: '12px',
          pb: '8px',
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(6, 1fr)',
              },
              gap: 3,
            }}
          >
            {categories.map((category) => (
              <Card
                component={Link}
                href={category.href}
                key={category.title}
                variant="outlined"
                sx={{
                  borderRadius: '8px',
                  color: 'inherit',
                  textDecoration: 'none',
                  boxShadow: '0 12px 32px rgba(33,38,49,0.05)',
                  transition:
                    'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 18px 42px rgba(243, 2, 116, 0.14)',
                    transform: 'translateY(-3px)',
                  },
                }}
              >
                <CardContent sx={{ p: 2.3, '&:last-child': { pb: 2.3 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: '8px',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#FFFFFF',
                        background: 'linear-gradient(135deg, #F30274 0%, #5B123D 100%)',
                      }}
                    >
                      <HouseOutlinedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 800, lineHeight: 1.2 }}>
                        {category.title}
                      </Typography>
                      <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                        {category.count}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      <Box
        component="section"
        sx={{ position: 'relative', zIndex: 2, pt: 0, pb: { xs: 5, md: 7 } }}
      >
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0 }}>
              Imóveis em destaque
            </Typography>
            <MuiLink
              component={Link}
              href="/imoveis"
              underline="none"
              sx={{ color: 'primary.main', fontSize: 13, fontWeight: 800 }}
            >
              Ver todos os imóveis ○
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
                  transition:
                    'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
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
    </Box>
  )
}
