'use client'

import { useState } from 'react'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material'
import { alpha as muiAlpha } from '@mui/material/styles'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import { brand, radius, surface } from '@shared/theme/tokens'

import { AuthFormField } from './AuthFormField'
import { useLogin } from '../hooks/use-login'
import { loginSchema, type LoginFormValues } from '../schemas/login-schema'

type LoginFormProps = {
  callbackUrl: string
}

const authTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    height: 46,
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: brand.neutral[100],
  },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: brand.neutral[300],
  },
  '& .MuiInputBase-input': {
    px: 1.75,
    py: 1.5,
    '&::placeholder': {
      color: brand.neutral[500],
      opacity: 1,
    },
    '&:-webkit-autofill': {
      WebkitBoxShadow: `0 0 0 100px ${surface.paper} inset`,
      WebkitTextFillColor: brand.graphite[500],
      caretColor: brand.graphite[500],
    },
  },
  '& .MuiFormHelperText-root': {
    mx: 0,
    mt: 0.75,
  },
} as const

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const { error, login } = useLogin(callbackUrl)
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ mb: 0.75 }}>
          Entrar na sua conta
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Acesse sua conta para gerenciar imóveis
        </Typography>
      </Box>

      <Box component="form" noValidate onSubmit={handleSubmit(login)}>
        <Stack spacing={2.5}>
          <AuthFormField htmlFor="login-email" label="E-mail">
            <RhfTextField
              id="login-email"
              control={control}
              name="email"
              placeholder="seu@email.com"
              type="email"
              autoComplete="email"
              fullWidth
              sx={authTextFieldSx}
            />
          </AuthFormField>

          <Box>
            <AuthFormField htmlFor="login-password" label="Senha">
              <RhfTextField
                id="login-password"
                control={control}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                fullWidth
                sx={authTextFieldSx}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        edge="end"
                        size="small"
                        onClick={() => setShowPassword((current) => !current)}
                        sx={{ color: brand.neutral[500] }}
                      >
                        {showPassword ? (
                          <VisibilityOffOutlinedIcon fontSize="small" />
                        ) : (
                          <VisibilityOutlinedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </AuthFormField>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <MuiLink
                component={Link}
                href="/recuperar-senha"
                underline="hover"
                sx={{ color: 'primary.main', fontSize: 13, fontWeight: 700 }}
              >
                Esqueceu a senha?
              </MuiLink>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" role="alert">
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isSubmitting}
            sx={{
              height: 50,
              mt: '12px !important',
              borderRadius: `${radius.sm}px`,
              boxShadow: `0 8px 18px ${muiAlpha(brand.magenta[500], 0.2)}`,
            }}
          >
            {isSubmitting ? <CircularProgress color="inherit" size={21} /> : 'Entrar'}
          </Button>

          <Divider
            sx={{
              color: 'text.secondary',
              typography: 'caption',
              '&::before, &::after': { borderColor: brand.neutral[100] },
            }}
          >
            ou
          </Divider>

          <Button
            type="button"
            variant="outlined"
            color="secondary"
            size="large"
            fullWidth
            disabled
            aria-label="Continuar com Google (em breve)"
            startIcon={
              <Box
                aria-hidden="true"
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: '#EA4335',
                  color: 'common.white',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                G
              </Box>
            }
            sx={{
              height: 50,
              borderRadius: `${radius.md}px`,
              bgcolor: surface.paper,
              borderColor: brand.neutral[100],
              '&.Mui-disabled': {
                borderColor: brand.neutral[100],
                color: 'text.primary',
              },
            }}
          >
            Continuar com Google
          </Button>
        </Stack>
      </Box>

      <Stack
        direction="row"
        justifyContent="center"
        spacing={0.5}
        sx={{
          mt: { xs: 5, md: 0 },
          position: { xs: 'static', md: 'absolute' },
          bottom: { md: 28 },
          left: { md: 0 },
          right: { md: 0 },
          color: 'text.secondary',
          fontSize: 13,
        }}
      >
        <Typography variant="body2">Não tem conta?</Typography>
        <MuiLink
          component={Link}
          href="/cadastro"
          underline="hover"
          sx={{ color: 'primary.main', fontSize: 14, fontWeight: 700 }}
        >
          Criar conta
        </MuiLink>
      </Stack>
    </Box>
  )
}
