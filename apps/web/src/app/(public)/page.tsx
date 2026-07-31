'use client'

import { useState, type MouseEvent } from 'react'
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
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined'
import BedOutlinedIcon from '@mui/icons-material/BedOutlined'
import CloseIcon from '@mui/icons-material/Close'
import FacebookOutlinedIcon from '@mui/icons-material/FacebookOutlined'
import HouseOutlinedIcon from '@mui/icons-material/HouseOutlined'
import InstagramIcon from '@mui/icons-material/Instagram'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import LocalParkingOutlinedIcon from '@mui/icons-material/LocalParkingOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import SquareFootOutlinedIcon from '@mui/icons-material/SquareFootOutlined'
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined'
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined'
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

const miniProperties = [
  {
    title: 'Apartamento compacto',
    location: 'Pinheiros',
    image:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=520&q=75',
  },
  {
    title: 'Casa térrea',
    location: 'Moema',
    image:
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=520&q=75',
  },
  {
    title: 'Sala comercial',
    location: 'Itaim Bibi',
    image:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=520&q=75',
  },
  {
    title: 'Cobertura duplex',
    location: 'Jardins',
    image:
      'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=520&q=75',
  },
  {
    title: 'Studio mobiliado',
    location: 'Vila Madalena',
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=520&q=75',
  },
  {
    title: 'Lote urbano',
    location: 'Alphaville',
    image:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=520&q=75',
  },
]

const detailIcons = [
  BedOutlinedIcon,
  BathtubOutlinedIcon,
  LocalParkingOutlinedIcon,
  SquareFootOutlinedIcon,
]

const searchOptions = {
  location: {
    label: 'Localização',
    query: 'localizacao',
    values: [
      'Jardins, São Paulo',
      'Vila Madalena, São Paulo',
      'Itaim Bibi, São Paulo',
      'Moema, São Paulo',
      'Pinheiros, São Paulo',
      'Savassi, Belo Horizonte',
      'Batista Campos, Belém',
    ],
  },
  propertyType: {
    label: 'Tipo de imóvel',
    query: 'tipo',
    values: [
      'Apartamento',
      'Casas residenciais',
      'Salas comerciais',
      'Terrenos e lotes',
      'Coberturas',
      'Chácaras e sítios',
      'Studios',
    ],
  },
  priceRange: {
    label: 'Faixa de preço',
    query: 'preco',
    values: [
      'Até R$ 2.500',
      'R$ 2.500 - R$ 6.000',
      'R$ 6.000 - R$ 10.000',
      'R$ 10.000 - R$ 18.000',
      'R$ 18.000 - R$ 35.000',
      'Acima de R$ 35.000',
    ],
  },
} as const

type SearchFilterKey = keyof typeof searchOptions

const searchFilterOrder: SearchFilterKey[] = ['location', 'propertyType', 'priceRange']

const userProfile = {
  name: 'Rafael Martins',
  role: 'Corretor parceiro',
  company: 'Ketris Prime',
  email: 'rafael@ketris.com.br',
  avatar:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
}

const profileActions = [
  { label: 'Suporte', icon: SupportAgentOutlinedIcon, href: '/login' },
  { label: 'Configurações', icon: SettingsOutlinedIcon, href: '/login' },
  { label: 'Trocar modalidade', icon: SwapHorizOutlinedIcon, href: '/imoveis' },
  { label: 'Sair', icon: LogoutOutlinedIcon, href: '/login', tone: 'danger' },
]

const footerColumns = [
  {
    title: 'Para você',
    links: ['Buscar imóveis', 'Favoritos', 'Simulador financeiro'],
  },
  {
    title: 'Corretores',
    links: ['Quero anunciar', 'Portal parceiro', 'Soluções corporativas'],
  },
  {
    title: 'Empresa',
    links: ['Sobre nós', 'Contato', 'Trabalhe conosco'],
  },
]

// Home / marketplace público — renderizada no servidor (SEO).
export default function HomePage() {
  const [selectedSearch, setSelectedSearch] = useState<Record<SearchFilterKey, string>>({
    location: searchOptions.location.values[0],
    propertyType: searchOptions.propertyType.values[0],
    priceRange: searchOptions.priceRange.values[1],
  })
  const [activeSearchMenu, setActiveSearchMenu] = useState<SearchFilterKey | null>(null)
  const [searchAnchor, setSearchAnchor] = useState<HTMLElement | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const openSearchMenu = (event: MouseEvent<HTMLElement>, key: SearchFilterKey) => {
    setSearchAnchor(event.currentTarget)
    setActiveSearchMenu(key)
  }

  const closeSearchMenu = () => {
    setSearchAnchor(null)
    setActiveSearchMenu(null)
  }

  const selectSearchValue = (key: SearchFilterKey, value: string) => {
    setSelectedSearch((current) => ({ ...current, [key]: value }))
    closeSearchMenu()
  }

  const searchHref = `/imoveis?${searchFilterOrder
    .map((key) => `${searchOptions[key].query}=${encodeURIComponent(selectedSearch[key])}`)
    .join('&')}`

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100vw',
        minHeight: '100vh',
        overflowX: 'clip',
        bgcolor: '#F7F8FA',
      }}
    >
      <Box
        component="header"
        sx={{
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          width: '100%',
        }}
      >
        <Container maxWidth="xl">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ minHeight: 38, gap: 2 }}
          >
            <Box
              component={Link}
              href="/"
              aria-label="Ketris"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                width: { xs: 83, sm: 98 },
                height: 30,
                textDecoration: 'none',
              }}
            >
              <Box
                component="img"
                src="/ketris-logo-transparent.png"
                alt="Ketris"
                sx={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                }}
              />
            </Box>

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
                    px: 1.2,
                    py: 0.7,
                    mt: 0.1,
                    borderRadius: '8px',
                    position: 'relative',
                    transition:
                      'background-color 160ms ease, color 160ms ease, transform 160ms ease',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: -2,
                      height: 2,
                      bgcolor: item === 'Comprar' ? 'primary.main' : 'transparent',
                    },
                    '&:hover': {
                      bgcolor: 'rgba(243, 2, 116, 0.08)',
                      color: 'primary.main',
                      transform: 'translateY(-1px)',
                    },
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
                  transition:
                    'background-color 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
                  '&:hover': {
                    bgcolor: 'rgba(243, 2, 116, 0.08)',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    boxShadow: '0 8px 22px rgba(243, 2, 116, 0.16)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Anunciar Imóvel
              </Button>
              <IconButton aria-label="notificações" size="small">
                <NotificationsNoneOutlinedIcon fontSize="small" />
              </IconButton>
              <Box
                component="button"
                type="button"
                aria-label="Abrir perfil"
                aria-haspopup="dialog"
                onClick={() => setIsProfileOpen(true)}
                sx={{
                  width: 38,
                  height: 38,
                  p: 0,
                  border: 0,
                  borderRadius: 999,
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  position: 'relative',
                  zIndex: 1,
                  transition: 'box-shadow 160ms ease, transform 160ms ease',
                  '&:hover': {
                    boxShadow: '0 0 0 3px rgba(243, 2, 116, 0.14)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Avatar
                  alt={userProfile.name}
                  src={userProfile.avatar}
                  sx={{ width: 30, height: 30 }}
                />
              </Box>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {isProfileOpen && (
        <Box
          role="dialog"
          aria-modal="true"
          aria-label="Perfil do usuário"
          onClick={() => setIsProfileOpen(false)}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            display: 'grid',
            placeItems: { xs: 'end center', sm: 'center' },
            bgcolor: 'rgba(13, 15, 20, 0.48)',
            p: { xs: 1.5, sm: 3 },
          }}
        >
          <Box
            onClick={(event) => event.stopPropagation()}
            sx={{
              width: '100%',
              maxWidth: 390,
              borderRadius: '8px',
              bgcolor: '#FFFFFF',
              boxShadow: '0 24px 70px rgba(13,15,20,0.32)',
              p: 2.4,
            }}
          >
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  alt={userProfile.name}
                  src={userProfile.avatar}
                  sx={{ width: 48, height: 48 }}
                />
                <Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 900 }}>{userProfile.name}</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700 }}>
                    {userProfile.role}
                  </Typography>
                </Box>
              </Stack>
              <IconButton
                aria-label="Fechar perfil"
                size="small"
                onClick={() => setIsProfileOpen(false)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>

            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px',
                bgcolor: '#F7F8FA',
                px: 1.5,
                py: 1.2,
                mb: 2,
              }}
            >
              <Typography sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 800 }}>
                {userProfile.company}
              </Typography>
              <Typography sx={{ color: 'text.primary', fontSize: 12, fontWeight: 700 }}>
                {userProfile.email}
              </Typography>
            </Box>

            <Stack spacing={1}>
              {profileActions.map((action) => {
                const Icon = action.icon
                const isDanger = action.tone === 'danger'
                return (
                  <Button
                    key={action.label}
                    component={Link}
                    href={action.href}
                    onClick={() => setIsProfileOpen(false)}
                    startIcon={<Icon fontSize="small" />}
                    fullWidth
                    sx={{
                      justifyContent: 'flex-start',
                      minHeight: 42,
                      borderRadius: '8px',
                      color: isDanger ? 'error.main' : 'text.primary',
                      bgcolor: isDanger ? 'rgba(229, 72, 77, 0.06)' : 'transparent',
                      textTransform: 'none',
                      fontWeight: 800,
                      '&:hover': {
                        bgcolor: isDanger ? 'rgba(229, 72, 77, 0.1)' : 'rgba(243, 2, 116, 0.08)',
                        color: isDanger ? 'error.main' : 'primary.main',
                      },
                    }}
                  >
                    {action.label}
                  </Button>
                )
              })}
            </Stack>
          </Box>
        </Box>
      )}

      <Box
        component="section"
        sx={{
          position: 'relative',
          zIndex: 0,
          color: '#FFFFFF',
          minHeight: { xs: 342, md: 455 },
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          width: '100%',
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
              py: { xs: 3.5, md: 9 },
              isolation: 'isolate',
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <Typography
                variant="h1"
                sx={{
                  maxWidth: 620,
                  color: '#FFFFFF',
                  fontSize: { xs: '1.72rem', md: '3.4rem' },
                  letterSpacing: 0,
                  mb: { xs: 1.2, md: 2 },
                }}
              >
                A infraestrutura digital do mercado imobiliário
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.72)',
                  mb: { xs: 2.2, md: 4 },
                  maxWidth: 670,
                  fontSize: { xs: 13, md: 16 },
                }}
              >
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
                  display: { xs: 'none', md: 'flex' },
                }}
              >
                {searchFilterOrder.map((key, index) => (
                  <Box
                    key={key}
                    sx={{
                      flex: 1,
                      borderRight: index < 2 ? { xs: 0, md: '1px solid' } : 0,
                      borderColor: 'divider',
                    }}
                  >
                    <Button
                      fullWidth
                      onClick={(event) => openSearchMenu(event, key)}
                      endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 18 }} />}
                      sx={{
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        minHeight: 55,
                        px: { xs: 1, md: 2 },
                        py: 0.6,
                        color: 'text.primary',
                        borderRadius: '8px',
                        textAlign: 'left',
                        textTransform: 'none',
                        '& .MuiButton-endIcon': {
                          color: 'text.disabled',
                          ml: 1,
                        },
                        '&:hover': {
                          bgcolor: 'rgba(243, 2, 116, 0.06)',
                        },
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            color: 'text.disabled',
                            fontSize: 10,
                            fontWeight: 800,
                            lineHeight: 1.2,
                            textTransform: 'uppercase',
                          }}
                        >
                          {searchOptions[key].label}
                        </Typography>
                        <Typography
                          sx={{
                            color: 'text.primary',
                            fontSize: 13,
                            fontWeight: 900,
                            lineHeight: 1.35,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {selectedSearch[key]}
                        </Typography>
                      </Box>
                    </Button>
                  </Box>
                ))}
                <Button
                  component={Link}
                  href={searchHref}
                  variant="contained"
                  sx={{ minHeight: 47, px: 3.4, borderRadius: '8px' }}
                >
                  Buscar
                </Button>
              </Stack>

              <Box
                sx={{
                  display: { xs: 'block', md: 'none' },
                  bgcolor: '#FFFFFF',
                  borderRadius: '8px',
                  p: 1.2,
                  maxWidth: 360,
                  boxShadow: '0 18px 45px rgba(0,0,0,0.24)',
                }}
              >
                <Button
                  fullWidth
                  onClick={(event) => openSearchMenu(event, 'location')}
                  startIcon={<SearchOutlinedIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    justifyContent: 'flex-start',
                    minHeight: 38,
                    px: 1.4,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '8px',
                    color: 'text.secondary',
                    bgcolor: '#FFFFFF',
                    textAlign: 'left',
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#F7F8FA' },
                    '& .MuiButton-startIcon': {
                      color: 'primary.main',
                    },
                  }}
                >
                  <Typography
                    sx={{
                      color: 'text.secondary',
                      fontSize: 12,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Buscar por bairro, cidade...
                  </Typography>
                </Button>
                <Button
                  component={Link}
                  href={searchHref}
                  variant="contained"
                  fullWidth
                  sx={{ mt: 1, minHeight: 38, borderRadius: '8px', fontSize: 13 }}
                >
                  Buscar
                </Button>
              </Box>

              <Menu
                anchorEl={searchAnchor}
                open={activeSearchMenu !== null}
                onClose={closeSearchMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1,
                      minWidth: 240,
                      borderRadius: '8px',
                      boxShadow: '0 18px 48px rgba(13,15,20,0.18)',
                    },
                  },
                }}
              >
                {activeSearchMenu &&
                  searchOptions[activeSearchMenu].values.map((value) => (
                    <MenuItem
                      key={value}
                      selected={selectedSearch[activeSearchMenu] === value}
                      onClick={() => selectSearchValue(activeSearchMenu, value)}
                      sx={{
                        fontSize: 13,
                        fontWeight: selectedSearch[activeSearchMenu] === value ? 900 : 700,
                      }}
                    >
                      {value}
                    </MenuItem>
                  ))}
              </Menu>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1.5, sm: 5 }}
                sx={{ mt: 4, display: { xs: 'none', sm: 'flex' } }}
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
                    width: { xs: 760, lg: 1168 },
                    height: 644,
                    maxWidth: '140vw',
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
              display: { xs: 'flex', sm: 'grid' },
              gridTemplateColumns: {
                xs: 'none',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(6, 1fr)',
              },
              gap: { xs: 1, sm: 3 },
              overflowX: { xs: 'auto', sm: 'visible' },
              pb: { xs: 0.5, sm: 0 },
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
            }}
          >
            {categories.map((category, index) => (
              <Card
                component={Link}
                href={category.href}
                key={category.title}
                variant="outlined"
                sx={{
                  flex: { xs: '0 0 auto', sm: 'initial' },
                  borderRadius: { xs: 999, sm: '8px' },
                  borderColor: { xs: index === 0 ? 'primary.main' : 'divider', sm: 'divider' },
                  bgcolor: { xs: index === 0 ? 'primary.main' : '#FFFFFF', sm: '#FFFFFF' },
                  color: 'inherit',
                  textDecoration: 'none',
                  boxShadow: { xs: 'none', sm: '0 12px 32px rgba(33,38,49,0.05)' },
                  transition:
                    'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: { xs: 'none', sm: '0 18px 42px rgba(243, 2, 116, 0.14)' },
                    transform: { xs: 'none', sm: 'translateY(-3px)' },
                  },
                }}
              >
                <CardContent
                  sx={{
                    px: { xs: 1.45, sm: 2.3 },
                    py: { xs: 0.75, sm: 2.3 },
                    '&:last-child': { pb: { xs: 0.75, sm: 2.3 } },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={{ xs: 0, sm: 1.5 }}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: '8px',
                        display: { xs: 'none', sm: 'grid' },
                        placeItems: 'center',
                        color: '#FFFFFF',
                        background: 'linear-gradient(135deg, #F30274 0%, #5B123D 100%)',
                      }}
                    >
                      <HouseOutlinedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          color: {
                            xs: index === 0 ? '#FFFFFF' : 'text.primary',
                            sm: 'text.primary',
                          },
                          fontSize: { xs: 11, sm: 14 },
                          fontWeight: { xs: 800, sm: 800 },
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {category.title}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 12 }}
                      >
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

      <Box
        component="section"
        sx={{
          bgcolor: '#FFFFFF',
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
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: '#F7F8FA',
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
                    backgroundImage: `linear-gradient(180deg, rgba(33,38,49,0.02), rgba(33,38,49,0.18)), url("${property.image}")`,
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

      <Box component="footer" sx={{ bgcolor: '#212631', color: '#FFFFFF' }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'minmax(260px, 1.7fr) repeat(3, minmax(120px, 1fr))',
              },
              gap: { xs: 4, md: 7 },
              py: { xs: 6, md: 7 },
            }}
          >
            <Box>
              <Box
                component={Link}
                href="/"
                aria-label="Ketris"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  width: 102,
                  mb: 2,
                  textDecoration: 'none',
                }}
              >
                <Box
                  component="img"
                  src="/ketris-logo-footer.png"
                  alt="Ketris"
                  sx={{
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                  }}
                />
              </Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.62)', fontSize: 13, maxWidth: 360 }}>
                Tecnologia e simplificação de ponta a ponta no mercado imobiliário corporativo e
                residencial.
              </Typography>
              <Stack direction="row" spacing={1.2} sx={{ mt: 3 }}>
                {[
                  ['Instagram', InstagramIcon],
                  ['Facebook', FacebookOutlinedIcon],
                  ['LinkedIn', LinkedInIcon],
                ].map(([label, Icon]) => (
                  <IconButton
                    key={label as string}
                    aria-label={label as string}
                    size="small"
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.78)',
                      '&:hover': {
                        bgcolor: 'primary.main',
                        color: '#FFFFFF',
                      },
                    }}
                  >
                    <Icon sx={{ fontSize: 17 }} />
                  </IconButton>
                ))}
              </Stack>
            </Box>

            {footerColumns.map((column) => (
              <Box key={column.title}>
                <Typography sx={{ fontSize: 12, fontWeight: 900, mb: 2 }}>
                  {column.title}
                </Typography>
                <Stack spacing={1.25}>
                  {column.links.map((item) => (
                    <MuiLink
                      key={item}
                      component={Link}
                      href="/imoveis"
                      underline="none"
                      sx={{
                        color: 'rgba(255,255,255,0.56)',
                        fontSize: 12,
                        '&:hover': { color: '#FFFFFF' },
                      }}
                    >
                      {item}
                    </MuiLink>
                  ))}
                </Stack>
              </Box>
            ))}
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={2}
            sx={{ py: 3 }}
          >
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
              © 2026 Ketris Tecnologias Ltda. Todos os direitos reservados.
            </Typography>
            <Stack direction="row" spacing={3}>
              {['Termos de Uso', 'Política de Privacidade'].map((item) => (
                <MuiLink
                  key={item}
                  component={Link}
                  href="/"
                  underline="none"
                  sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                >
                  {item}
                </MuiLink>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}
