'use client'

import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import {
  Avatar,
  Box,
  Drawer,
  GlobalStyles,
  IconButton,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material'
import { Link as NextLink } from '@/i18n/navigation'
import { usePathname } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'

import {
  alpha,
  brand,
  iconSize,
  motion,
  radius,
  shadows,
  surface,
  zIndex,
} from '@shared/theme/tokens'

import {
  isOwnerNavigationItemActive,
  ownerDashboardNavigationItems,
} from '../config/owner-dashboard-navigation'
import { ownerDashboardBodyFontFamily } from './owner-dashboard.styles'

const fallbackOwnerName = 'Carlos Oliveira'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2)

  if (parts.length === 0) return 'CO'

  return parts
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
}

export function OwnerDashboardHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const ownerName = session?.user?.name?.trim() || fallbackOwnerName
  const ownerInitials = getInitials(ownerName)

  return (
    <>
      <GlobalStyles
        styles={(theme) => ({
          [theme.breakpoints.up('md')]: {
            html: { scrollbarGutter: 'stable' },
          },
        })}
      />
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: zIndex.header,
          width: '100%',
          height: { xs: 64, md: 56 },
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: surface.paper,
          px: { xs: 2, sm: 3, md: 4, lg: 6 },
          fontFamily: ownerDashboardBodyFontFamily,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            width: '100%',
            maxWidth: 'none',
            height: '100%',
            mx: 'auto',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr) auto',
              md: 'minmax(0, 1fr) auto minmax(0, 1fr)',
            },
            gridTemplateAreas: {
              md: '"brand navigation profile"',
            },
            alignItems: 'center',
            columnGap: { xs: 1, lg: 2 },
          }}
        >
          <Stack
            component={NextLink}
            href="/dashboard"
            direction="row"
            alignItems="baseline"
            spacing={0.75}
            aria-label="Ketris — Painel do Proprietário"
            sx={{
              minWidth: 0,
              width: 'fit-content',
              gridArea: { md: 'brand' },
              justifySelf: { md: 'start' },
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <Typography
              component="span"
              sx={{
                color: 'primary.main',
                fontSize: { xs: 18, md: 20 },
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: '-0.035em',
              }}
            >
              Ketris
            </Typography>
            <Typography
              component="span"
              sx={{
                color: brand.neutral[500],
                fontSize: { xs: 8, md: 9 },
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '0.025em',
                whiteSpace: 'nowrap',
              }}
            >
              PROPRIETÁRIO
            </Typography>
          </Stack>

          <Stack
            component="nav"
            aria-label="Navegação principal do proprietário"
            direction="row"
            alignItems="stretch"
            spacing={{ md: 1.5, lg: 2.5, xl: 3.5 }}
            sx={{
              display: { xs: 'none', md: 'flex' },
              height: '100%',
              gridArea: { md: 'navigation' },
              justifySelf: { md: 'center' },
            }}
          >
            {ownerDashboardNavigationItems.map((item) => {
              const active = isOwnerNavigationItemActive(pathname, item)
              const navigationItemSx = {
                position: 'relative',
                display: 'inline-flex',
                height: '100%',
                alignItems: 'center',
                px: 0.5,
                color: active ? brand.magenta[500] : brand.neutral[600],
                fontSize: 12.5,
                fontWeight: active ? 700 : 500,
                lineHeight: 1,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: motion.transition.interactive,
                '&::after': {
                  position: 'absolute',
                  right: 0,
                  bottom: 0,
                  left: 0,
                  height: 2,
                  bgcolor: active ? brand.magenta[500] : 'transparent',
                  content: '""',
                },
              } as const

              if (item.disabled || !item.href) {
                return (
                  <Box
                    key={item.id}
                    component="span"
                    aria-disabled="true"
                    title="Em breve"
                    sx={{ ...navigationItemSx, color: 'text.disabled', cursor: 'default' }}
                  >
                    {item.label}
                  </Box>
                )
              }

              return (
                <MuiLink
                  key={item.id}
                  component={NextLink}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  underline="none"
                  sx={{
                    ...navigationItemSx,
                    '&:hover': {
                      color: active ? brand.magenta[600] : brand.graphite[500],
                    },
                  }}
                >
                  {item.label}
                </MuiLink>
              )
            })}
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1.1}
            sx={{
              display: { xs: 'none', md: 'flex' },
              minWidth: 0,
              gridArea: { md: 'profile' },
              justifySelf: { md: 'end' },
            }}
          >
            <Avatar
              src={session?.user?.image ?? '/owner-avatar.svg'}
              alt={ownerName}
              sx={{
                width: 32,
                height: 32,
                flexShrink: 0,
                bgcolor: brand.neutral[700],
                color: surface.lightText,
                fontSize: 10.5,
                fontWeight: 700,
              }}
            >
              {ownerInitials}
            </Avatar>
            <Typography
              noWrap
              sx={{ maxWidth: 154, color: brand.graphite[500], fontSize: 13.5, fontWeight: 700 }}
            >
              {ownerName}
            </Typography>
          </Stack>

          <IconButton
            type="button"
            aria-label="Abrir menu"
            aria-controls="owner-mobile-navigation"
            aria-expanded={mobileOpen ? 'true' : undefined}
            onClick={() => setMobileOpen(true)}
            sx={{
              display: { xs: 'inline-flex', md: 'none' },
              width: 40,
              height: 40,
              justifySelf: 'end',
              color: brand.graphite[500],
            }}
          >
            <MenuRoundedIcon sx={{ fontSize: iconSize.xl }} />
          </IconButton>
        </Box>
      </Box>

      <Drawer
        id="owner-mobile-navigation"
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 'min(86vw, 320px)',
              border: 0,
              bgcolor: surface.paper,
              boxShadow: shadows.modal,
            },
          },
        }}
      >
        <Stack sx={{ minHeight: '100%', p: 2.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="baseline" spacing={0.75}>
              <Typography
                component="span"
                sx={{
                  color: 'primary.main',
                  fontSize: 20,
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: '-0.035em',
                }}
              >
                Ketris
              </Typography>
              <Typography
                component="span"
                sx={{
                  color: brand.neutral[500],
                  fontSize: 9,
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: '0.025em',
                }}
              >
                PROPRIETÁRIO
              </Typography>
            </Stack>
            <IconButton
              type="button"
              aria-label="Fechar menu"
              onClick={() => setMobileOpen(false)}
              sx={{ width: 40, height: 40, color: brand.graphite[500] }}
            >
              <CloseRoundedIcon sx={{ fontSize: iconSize.xl }} />
            </IconButton>
          </Stack>

          <Box sx={{ mt: 2, borderTop: '1px solid', borderColor: 'divider' }} />

          <Stack
            component="nav"
            aria-label="Navegação móvel do proprietário"
            spacing={0.5}
            sx={{ mt: 1.5 }}
          >
            {ownerDashboardNavigationItems.map((item) => {
              const active = isOwnerNavigationItemActive(pathname, item)
              const navigationItemSx = {
                display: 'flex',
                minHeight: 46,
                alignItems: 'center',
                px: 1.5,
                borderRadius: `${radius.sm}px`,
                color: active ? brand.magenta[700] : brand.graphite[500],
                bgcolor: active ? alpha.magenta[8] : 'transparent',
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                lineHeight: 1.2,
                textDecoration: 'none',
                transition: motion.transition.interactive,
              } as const

              if (item.disabled || !item.href) {
                return (
                  <Box
                    key={item.id}
                    component="span"
                    aria-disabled="true"
                    title="Em breve"
                    sx={{ ...navigationItemSx, color: 'text.disabled', cursor: 'default' }}
                  >
                    {item.label}
                  </Box>
                )
              }

              return (
                <MuiLink
                  key={item.id}
                  component={NextLink}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setMobileOpen(false)}
                  underline="none"
                  sx={{
                    ...navigationItemSx,
                    '&:hover': {
                      bgcolor: active ? alpha.magenta[10] : alpha.graphite[6],
                      color: active ? brand.magenta[700] : brand.graphite[500],
                    },
                  }}
                >
                  {item.label}
                </MuiLink>
              )
            })}
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            sx={{ mt: 'auto', pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}
          >
            <Avatar
              src={session?.user?.image ?? '/owner-avatar.svg'}
              alt={ownerName}
              sx={{
                width: 36,
                height: 36,
                bgcolor: brand.neutral[700],
                color: surface.lightText,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {ownerInitials}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 700 }}>
                {ownerName}
              </Typography>
              <Typography noWrap sx={{ color: 'text.secondary', fontSize: 11.5 }}>
                Proprietário
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Drawer>
    </>
  )
}
