'use client'

import { useMemo, useState, type ReactNode } from 'react'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined'
import { Avatar, Box, Drawer, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

import ketrisLogoFooter from '@shared/assets/ketris-logo-footer.png'
import { AppLogo } from '@shared/components/ui'
import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

import { CrmAccessBoundary } from './CrmAccessBoundary'

const sidebarWidth = 200

const navigationItems = [
  { label: 'Dashboard', href: '/dashboard', icon: BarChartOutlinedIcon },
  { label: 'Pipeline', href: '/crm', icon: ViewKanbanOutlinedIcon },
  { label: 'Contatos', href: '/crm/contatos', icon: PeopleOutlineIcon },
  { label: 'Imóveis', href: '/imoveis', icon: HomeOutlinedIcon },
  { label: 'Propostas', href: '/crm/propostas', icon: InsertDriveFileOutlinedIcon },
] as const

type CrmShellProps = {
  children: ReactNode
}

function getInitials(name?: string | null): string {
  if (!name) return 'K'

  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
}

export function CrmShell({ children }: CrmShellProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isPublicPipeline = pathname === '/crm'
  const userName = session?.user?.name ?? 'Equipe Ketris'
  const userContext = session?.user?.email ?? 'CRM imobiliário'
  const userInitials = useMemo(() => getInitials(userName), [userName])

  const sidebar = (
    <Stack
      component="aside"
      sx={{
        width: sidebarWidth,
        height: '100%',
        bgcolor: brand.graphite[600],
        color: surface.lightText,
        px: 2,
        py: 2.5,
      }}
    >
      <AppLogo
        src={ketrisLogoFooter}
        width={112}
        sx={{ alignSelf: 'flex-start', mb: 3.5, ml: 0.5 }}
      />

      <Stack
        component="nav"
        spacing={0.375}
        aria-label="Navegação do CRM"
        sx={{ ml: -1.5, mr: -0.5 }}
      >
        {navigationItems.map(({ label, href, icon: Icon }) => {
          const targetPath = href.split('?')[0]
          const active =
            targetPath === '/crm'
              ? pathname === '/crm' || pathname.startsWith('/crm/oportunidades')
              : pathname === targetPath || pathname.startsWith(`${targetPath}/`)

          return (
            <Box
              key={label}
              component={NextLink}
              href={href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? 'page' : undefined}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.125,
                minHeight: 36,
                px: 1.125,
                borderLeft: '3px solid',
                borderColor: active ? 'primary.main' : 'transparent',
                borderRadius: `${radius.sm}px`,
                bgcolor: active ? alpha.white[8] : 'transparent',
                color: active ? surface.lightText : alpha.white[62],
                textDecoration: 'none',
                transition: 'background-color 160ms ease, color 160ms ease',
                '&:hover': {
                  bgcolor: alpha.white[8],
                  color: surface.lightText,
                },
              }}
            >
              <Icon sx={{ fontSize: iconSize.sm, color: active ? 'primary.main' : 'inherit' }} />
              <Typography
                sx={{
                  fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  lineHeight: '18px',
                  letterSpacing: 0,
                }}
              >
                {label}
              </Typography>
            </Box>
          )
        })}
      </Stack>

      <Stack
        direction="row"
        spacing={1.3}
        alignItems="center"
        sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: alpha.white[8] }}
      >
        <Avatar
          src={session?.user?.image ?? undefined}
          alt={userName}
          sx={{ width: 38, height: 38, bgcolor: 'primary.main', fontSize: 13, fontWeight: 800 }}
        >
          {userInitials}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 800 }}>
            {userName}
          </Typography>
          <Typography noWrap sx={{ color: alpha.white[56], fontSize: 10.5 }}>
            {userContext}
          </Typography>
        </Box>
      </Stack>
    </Stack>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: surface.app }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'fixed',
          inset: '0 auto 0 0',
          width: sidebarWidth,
          zIndex: 10,
        }}
      >
        {sidebar}
      </Box>

      <Stack
        component="header"
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          inset: '0 0 auto 0',
          zIndex: 20,
          height: 64,
          px: 2,
          bgcolor: brand.graphite[600],
          color: surface.lightText,
          boxShadow: '0 5px 22px rgba(13,15,20,0.18)',
        }}
      >
        <Tooltip title="Abrir navegação">
          <IconButton
            aria-label="Abrir navegação"
            onClick={() => setMobileOpen(true)}
            sx={{ color: 'inherit' }}
          >
            <MenuRoundedIcon />
          </IconButton>
        </Tooltip>
        <AppLogo src={ketrisLogoFooter} width={92} />
        <Avatar
          src={session?.user?.image ?? undefined}
          alt={userName}
          sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 12, fontWeight: 800 }}
        >
          {userInitials}
        </Avatar>
      </Stack>

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ sx: { width: sidebarWidth, border: 0 } }}
      >
        {sidebar}
      </Drawer>

      <Box
        component="main"
        sx={{
          width: { xs: '100%', md: `calc(100% - ${sidebarWidth}px)` },
          minWidth: 0,
          ml: { md: `${sidebarWidth}px` },
          pt: { xs: '64px', md: 0 },
        }}
      >
        {isPublicPipeline ? children : <CrmAccessBoundary>{children}</CrmAccessBoundary>}
      </Box>
    </Box>
  )
}
