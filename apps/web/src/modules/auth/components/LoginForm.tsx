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
  Stack,
  Typography,
} from '@mui/material'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import { brand, componentText, externalBrand, radius, surface } from '@shared/theme/tokens'

import { AuthFormField } from './AuthFormField'
import { authRoutes } from '../config/auth-routes'
import { authPrimaryButtonSx, authTextFieldSx } from './auth-form.styles'
import { useLogin } from '../hooks/use-login'
import { loginSchema, type LoginFormValues } from '../schemas/login-schema'

const loginTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    height: { xs: 36, md: 46 },
  },
  '& .MuiInputBase-input': {
    px: { xs: 1.5, md: 1.75 },
    py: { xs: 1, md: 1.5 },
    ...componentText.authBody,
  },
} as const

import type { LoginFormProps } from '../types/login'

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
      <Box sx={{ mb: { xs: 2, md: 3.25 }, textAlign: { xs: 'center', md: 'left' } }}>
        <Typography variant="h3" sx={{ mb: 0.5, ...componentText.authTitle }}>
          Entrar na sua conta
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={componentText.authBody}>
          Acesse sua conta para gerenciar imóveis
        </Typography>
      </Box>

      <Box component="form" noValidate onSubmit={handleSubmit(login)}>
        <Stack spacing={{ xs: 1.5, md: 1.75 }}>
          <AuthFormField htmlFor="login-email" label="E-mail" labelSx={componentText.authBody}>
            <RhfTextField
              id="login-email"
              control={control}
              name="email"
              placeholder="seu@email.com"
              type="email"
              autoComplete="email"
              fullWidth
              sx={[authTextFieldSx, loginTextFieldSx]}
            />
          </AuthFormField>

          <Box>
            <AuthFormField htmlFor="login-password" label="Senha" labelSx={componentText.authBody}>
              <RhfTextField
                id="login-password"
                control={control}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                fullWidth
                sx={[authTextFieldSx, loginTextFieldSx]}
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

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: { xs: 0.75, md: 1 } }}>
              <Typography
                component={Link}
                href={authRoutes.forgotPassword}
                sx={{
                  color: 'primary.main',
                  ...componentText.authInlineLink,
                  fontWeight: 700,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Esqueceu a senha?
              </Typography>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" role="alert" sx={{ mt: 0.75 }}>
              {error}
            </Alert>
          )}
        </Stack>

        <Stack
          spacing={{ xs: 1.25, md: 1.75 }}
          sx={{ mt: error ? { xs: 2, md: 2.5 } : { xs: 2, md: 3.5 } }}
        >
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isSubmitting}
            sx={[authPrimaryButtonSx, { height: { xs: 36, md: 50 }, ...componentText.authBody }]}
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
                  bgcolor: externalBrand.google,
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
              height: { xs: 36, md: 50 },
              borderRadius: `${radius.md}px`,
              bgcolor: surface.paper,
              borderColor: brand.neutral[100],
              ...componentText.authBody,
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
    </Box>
  )
}
