import { Box, Dialog, Stack, styled } from '@mui/material'

export const AuthUnavailableContent = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(4),
  minHeight: '55vh',
  maxWidth: theme.spacing(75),
  margin: '0 auto',
}))

export const AuthUnavailableDialog = styled(Dialog)(({ theme }) => ({
  zIndex: theme.zIndex.modal + 100,
  '& .MuiBackdrop-root': { backgroundColor: theme.palette.background.default },
}))

export const AuthAvailabilityContent = styled(Box)({ minHeight: '100%' })
