'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  GlobalStyles,
  Typography,
} from '@mui/material'
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'

import { brand, surface, zIndex } from '@shared/theme/tokens'

const navigationItems = [
  { label: 'Painel', href: '/dashboard', Icon: GridViewOutlinedIcon },
  { label: 'Imóveis', href: '/dashboard/imoveis', Icon: HomeOutlinedIcon },
  { label: 'Propostas', href: '/dashboard/propostas', Icon: DescriptionOutlinedIcon },
  { label: 'Visitas', href: '/dashboard/agenda', Icon: CalendarTodayOutlinedIcon },
]

const itemSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0.5,
  minWidth: 0,
  minHeight: 64,
  py: 1,
  px: 0.5,
  fontSize: 10,
  fontWeight: 400,
  color: brand.neutral[500],
} as const

export function OwnerBottomNavigation() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
      <GlobalStyles
        styles={(theme) => ({
          [theme.breakpoints.down('md')]: {
            // Keep the development launcher clear of the fixed navigation on this route.
            '.tsqd-open-btn-container': {
              bottom: 'calc(80px + env(safe-area-inset-bottom, 0px)) !important',
            },
          },
        })}
      />
      <Box
        component="nav"
        aria-label="Navegação inferior do proprietário"
        sx={{
          display: { xs: 'grid', md: 'none' },
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          pb: 'env(safe-area-inset-bottom, 0px)',
          bgcolor: surface.paper,
          borderTop: '1px solid',
          borderColor: 'divider',
          zIndex: zIndex.header,
        }}
      >
        {navigationItems.map(({ label, href, Icon }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
          return (
            <Button
              key={href}
              component={NextLink}
              href={href}
              aria-current={active && !profileOpen ? 'page' : undefined}
              sx={{
                ...itemSx,
                color: active && !profileOpen ? 'primary.main' : brand.neutral[500],
              }}
            >
              <Icon sx={{ fontSize: 20 }} />
              {label}
            </Button>
          )
        })}
        <Button
          onClick={() => setProfileOpen(true)}
          aria-haspopup="dialog"
          sx={{ ...itemSx, color: profileOpen ? 'primary.main' : brand.neutral[500] }}
        >
          <PersonOutlineOutlinedIcon sx={{ fontSize: 20 }} />
          Perfil
        </Button>
      </Box>
      <Dialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        aria-labelledby="owner-profile-title"
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle id="owner-profile-title">Perfil</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontWeight: 700 }}>{session?.user?.name || 'Proprietário'}</Typography>
          <Typography sx={{ color: 'text.secondary', overflowWrap: 'anywhere' }}>
            {session?.user?.email}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
