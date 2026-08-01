import { type RefObject } from 'react'
import { Avatar, Box, Button, Container, IconButton, Link as MuiLink, Stack } from '@mui/material'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import Link from 'next/link'

import { userProfile } from './_homeData'

type HomeHeaderProps = {
  profileButtonRef: RefObject<HTMLButtonElement>
  onToggleProfile: () => void
}

export function HomeHeader({ profileButtonRef, onToggleProfile }: HomeHeaderProps) {
  return (
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
        <Box
          sx={{
            minHeight: 60,
            display: 'grid',
            gridTemplateColumns: { xs: 'auto 1fr', md: '1fr auto 1fr' },
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            component={Link}
            href="/"
            aria-label="Ketris"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifySelf: 'start',
              width: { xs: 100, sm: 118 },
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
            sx={{ display: { xs: 'none', md: 'flex' }, justifySelf: 'center' }}
          >
            {['Alugar', 'Comprar', 'Corretores', 'Imobiliárias'].map((item) => (
              <MuiLink
                key={item}
                component={Link}
                href="/imoveis"
                underline="none"
                sx={{
                  color: item === 'Alugar' ? 'primary.main' : 'text.secondary',
                  fontSize: 15.3,
                  fontWeight: 700,
                  px: 1.45,
                  py: 0.85,
                  mt: 0.1,
                  borderRadius: '8px',
                  position: 'relative',
                  transition: 'background-color 160ms ease, color 160ms ease, transform 160ms ease',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: -2,
                    height: 2,
                    bgcolor: item === 'Alugar' ? 'primary.main' : 'transparent',
                  },
                  '&:hover': {
                    bgcolor: 'transparent',
                    color: '#212631',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                {item}
              </MuiLink>
            ))}
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ justifySelf: 'end' }}>
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
                minHeight: 42,
                px: 2,
                fontSize: 14,
                transition:
                  'background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease',
                '&:hover': {
                  bgcolor: 'transparent',
                  borderColor: '#212631',
                  color: '#212631',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Anunciar Imóvel
            </Button>
            <IconButton aria-label="notificações" size="small" sx={{ width: 42, height: 42 }}>
              <NotificationsNoneOutlinedIcon sx={{ fontSize: 22 }} />
            </IconButton>
            <Box
              component="button"
              type="button"
              aria-label="Abrir perfil"
              aria-haspopup="dialog"
              ref={profileButtonRef}
              onClick={onToggleProfile}
              sx={{
                width: 48,
                height: 48,
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
                  boxShadow: '0 0 0 2px rgba(243, 2, 116, 0.14)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <Avatar
                alt={userProfile.name}
                src={userProfile.avatar}
                sx={{ width: 48, height: 48 }}
              />
            </Box>
          </Stack>
        </Box>
      </Container>
    </Box>
  )
}
