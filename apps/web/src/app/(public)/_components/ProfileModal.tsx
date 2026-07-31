import { Avatar, Box, Button, IconButton, Stack, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import Link from 'next/link'

import { profileActions, userProfile } from './_homeData'

type ProfileModalProps = {
  onClose: () => void
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Perfil do usuário"
      onClick={onClose}
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
          <IconButton aria-label="Fechar perfil" size="small" onClick={onClose}>
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
                onClick={onClose}
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
  )
}
