'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
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
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Link } from '@/i18n/navigation'
import { RhfTextField } from '@shared/components/form'
import { brand, componentText, externalBrand, radius, surface } from '@shared/theme/tokens'

import { authRoutes } from '../config/auth-routes'
import { useLogin } from '../hooks/use-login'
import { loginSchema, type LoginFormValues } from '../schemas/login-schema'
import { authPrimaryButtonSx, authTextFieldSx } from './auth-form.styles'
import { AuthFormField } from './AuthFormField'
import { LoginAccountPrompt } from './LoginAccountPrompt'

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
  const t = useTranslations('auth.login')
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
          {t('title')}
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={componentText.authBody}>
          {t('subtitle')}
        </Typography>
      </Box>

      <Box component="form" noValidate onSubmit={handleSubmit(login)}>
        <Stack spacing={{ xs: 1.5, md: 1.75 }}>
          <AuthFormField
            htmlFor="login-email"
            label={t('email.label')}
            labelSx={componentText.authBody}
          >
            <RhfTextField
              id="login-email"
              control={control}
              name="email"
              placeholder={t('email.placeholder')}
              type="email"
              autoComplete="email"
              fullWidth
              sx={[authTextFieldSx, loginTextFieldSx]}
            />
          </AuthFormField>

          <Box>
            <AuthFormField
              htmlFor="login-password"
              label={t('password.label')}
              labelSx={componentText.authBody}
            >
              <RhfTextField
                id="login-password"
                control={control}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                fullWidth
                sx={[authTextFieldSx, loginTextFieldSx]}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? t('password.hide') : t('password.show')}
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
                  },
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
                {t('forgotPassword')}
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
            {isSubmitting ? <CircularProgress color="inherit" size={21} /> : t('submit')}
          </Button>

          <Divider
            sx={{
              color: 'text.secondary',
              typography: 'caption',
              '&::before, &::after': { borderColor: brand.neutral[100] },
            }}
          >
            {t('separator')}
          </Divider>

          <Button
            type="button"
            variant="outlined"
            color="secondary"
            size="large"
            fullWidth
            disabled
            aria-label={t('google.ariaLabel')}
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
            {t('google.label')}
          </Button>
        </Stack>
      </Box>

      <Box sx={{ mt: { xs: 2.5, md: 3 }, display: 'flex', justifyContent: 'center' }}>
        <LoginAccountPrompt />
      </Box>
    </Box>
  )
}
