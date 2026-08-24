'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Avatar,
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import InsertChartOutlinedRoundedIcon from '@mui/icons-material/InsertChartOutlinedRounded'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'

import ketrisLogo from '@shared/assets/ketris-logo-footer.png'
import { alpha, brand, componentText, iconSize, radius, surface } from '@shared/theme/tokens'

const navigationItems = [
  { label: 'Dashboard', href: '/dashboard', icon: DashboardOutlinedIcon },
  { label: 'Meus Imóveis', href: '/dashboard/imoveis', icon: HomeWorkOutlinedIcon },
  { label: 'Perfil Público', href: '/dashboard/perfil-publico', icon: PaletteOutlinedIcon },
  { label: 'Leads', href: '/dashboard/leads', icon: PeopleAltOutlinedIcon },
  { label: 'Agenda', href: '/dashboard/agenda', icon: CalendarTodayOutlinedIcon },
  { label: 'Propostas', href: '/dashboard/propostas', icon: LocalOfferOutlinedIcon },
  { label: 'Financeiro', href: '/dashboard/financeiro', icon: InsertChartOutlinedRoundedIcon },
]

function isActiveNavigationItem(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <Box
      component="aside"
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        bgcolor: brand.graphite[500],
        color: surface.lightText,
        px: 2,
        py: 2.2,
      }}
    >
      <Box
        component="img"
        src={ketrisLogo.src}
        alt="Ketris"
        sx={{
          display: 'block',
          width: 124,
          height: 'auto',
          mb: 3.3,
        }}
      />

      <List disablePadding sx={{ display: 'grid', gap: 0.7 }}>
        {navigationItems.map((item) => {
          const Icon = item.icon
          const active = isActiveNavigationItem(pathname, item.href)

          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={active}
              sx={{
                minHeight: 36,
                borderRadius: `${radius.sm}px`,
                px: 1.2,
                color: active ? surface.lightText : alpha.white[62],
                transition: 'background-color 160ms ease, color 160ms ease',
                '&.Mui-selected, &.Mui-selected:hover': {
                  bgcolor: 'primary.main',
                  color: surface.lightText,
                },
                '&:hover': {
                  bgcolor: alpha.white[8],
                  color: surface.lightText,
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 28 }}>
                <Icon sx={{ fontSize: iconSize.md }} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  sx: { fontSize: 12, fontWeight: active ? 900 : 700 },
                }}
              />
            </ListItemButton>
          )
        })}
      </List>

      <Box sx={{ flex: 1 }} />
      <Divider sx={{ borderColor: alpha.white[8], mb: 1.7 }} />
      <Stack direction="row" alignItems="center" spacing={1.1}>
        <Avatar
          sx={{
            width: 30,
            height: 30,
            bgcolor: brand.neutral[700],
            fontSize: 11,
            fontWeight: 900,
          }}
        >
          GS
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 11.5, fontWeight: 900 }}>
            Guilherme Silva
          </Typography>
          <Typography noWrap sx={{ ...componentText.footerLegal, color: alpha.white[50] }}>
            Gestor de Operações
          </Typography>
        </Box>
      </Stack>
    </Box>
  )
}
