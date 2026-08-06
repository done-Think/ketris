'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputAdornment,
  Typography,
} from '@mui/material'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Controller, useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import { brand } from '@shared/theme/tokens'

import { AuthFormField } from './AuthFormField'
import { authPrimaryButtonSx, authTextFieldSx } from './auth-form.styles'
import { registrationFontFamily } from './registration.styles'
import type { RegistrationProfileId } from '../config/registration-profiles'
import {
  registrationDetailsSchema,
  type RegistrationDetailsFormValues,
} from '../schemas/registration-details-schema'

type PasswordFieldName = 'password' | 'passwordConfirmation'

type RegistrationDetailsFormProps = {
  profile: RegistrationProfileId
  onSubmit?: (values: RegistrationDetailsFormValues) => void
}

const passwordFields: ReadonlyArray<{
  name: PasswordFieldName
  label: string
  placeholder: string
}> = [
  { name: 'password', label: 'Senha', placeholder: 'Crie uma senha' },
  {
    name: 'passwordConfirmation',
    label: 'Confirmar senha',
    placeholder: 'Confirme a senha',
  },
]

const registrationTextFieldSx = [
  authTextFieldSx,
  {
    '& .MuiInputBase-input, & .MuiFormHelperText-root': {
      fontFamily: registrationFontFamily.body,
    },
  },
] as const

export function RegistrationDetailsForm({ profile, onSubmit }: RegistrationDetailsFormProps) {
  const [visiblePasswordField, setVisiblePasswordField] = useState<PasswordFieldName | null>(null)
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegistrationDetailsFormValues>({
    resolver: zodResolver(registrationDetailsSchema),
    defaultValues: {
      profile,
      fullName: '',
      email: '',
      phone: '',
      password: '',
      passwordConfirmation: '',
      creci: '',
      acceptTerms: false,
    },
  })

  function submitDetails(values: RegistrationDetailsFormValues) {
    onSubmit?.(values)
  }

  function togglePasswordVisibility(fieldName: PasswordFieldName) {
    setVisiblePasswordField((current) => (current === fieldName ? null : fieldName))
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(submitDetails)} sx={{ mt: 4 }}>
      <Box sx={{ display: 'grid', gap: 2.25 }}>
        <AuthFormField
          htmlFor="registration-full-name"
          label="Nome completo"
          labelSx={{ fontFamily: registrationFontFamily.body }}
          required
        >
          <RhfTextField
            id="registration-full-name"
            control={control}
            name="fullName"
            placeholder="Digite seu nome completo"
            autoComplete="name"
            fullWidth
            sx={registrationTextFieldSx}
          />
        </AuthFormField>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1.35fr) minmax(0, 0.85fr)' },
            gap: 2,
          }}
        >
          <AuthFormField
            htmlFor="registration-email"
            label="E-mail"
            labelSx={{ fontFamily: registrationFontFamily.body }}
            required
          >
            <RhfTextField
              id="registration-email"
              control={control}
              name="email"
              placeholder="seu@email.com"
              type="email"
              autoComplete="email"
              fullWidth
              sx={registrationTextFieldSx}
            />
          </AuthFormField>

          <AuthFormField
            htmlFor="registration-phone"
            label="Telefone"
            labelSx={{ fontFamily: registrationFontFamily.body }}
            required
          >
            <RhfTextField
              id="registration-phone"
              control={control}
              name="phone"
              placeholder="(11) 99999-9999"
              type="tel"
              autoComplete="tel"
              fullWidth
              sx={registrationTextFieldSx}
            />
          </AuthFormField>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {passwordFields.map((field) => {
            const isVisible = visiblePasswordField === field.name

            return (
              <AuthFormField
                key={field.name}
                htmlFor={`registration-${field.name}`}
                label={field.label}
                labelSx={{ fontFamily: registrationFontFamily.body }}
                required
              >
                <RhfTextField
                  id={`registration-${field.name}`}
                  control={control}
                  name={field.name}
                  placeholder={field.placeholder}
                  type={isVisible ? 'text' : 'password'}
                  autoComplete="new-password"
                  fullWidth
                  sx={registrationTextFieldSx}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={
                            isVisible ? `Ocultar ${field.label}` : `Mostrar ${field.label}`
                          }
                          edge="end"
                          size="small"
                          onClick={() => togglePasswordVisibility(field.name)}
                          sx={{ color: brand.neutral[500] }}
                        >
                          {isVisible ? (
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
            )
          })}
        </Box>

        <AuthFormField
          htmlFor="registration-creci"
          label="CRECI"
          labelSx={{ fontFamily: registrationFontFamily.body }}
          required={profile === 'corretor'}
        >
          <RhfTextField
            id="registration-creci"
            control={control}
            name="creci"
            placeholder="00000-F"
            helperText={
              profile === 'corretor'
                ? 'Campo obrigatório para corretores'
                : 'Campo opcional para este perfil'
            }
            fullWidth
            sx={registrationTextFieldSx}
          />
        </AuthFormField>
      </Box>

      <Controller
        control={control}
        name="acceptTerms"
        render={({ field, fieldState }) => (
          <FormControl error={Boolean(fieldState.error)} sx={{ mt: 2.25 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={field.value}
                  inputRef={field.ref}
                  name={field.name}
                  onBlur={field.onBlur}
                  onChange={(_, checked) => field.onChange(checked)}
                  size="small"
                  sx={{ p: 0, mr: 1.25, color: brand.neutral[200] }}
                />
              }
              label={
                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{ fontFamily: registrationFontFamily.body }}
                >
                  Li e aceito os{' '}
                  <Box component="span" sx={{ color: 'primary.main' }}>
                    Termos de Uso
                  </Box>{' '}
                  e{' '}
                  <Box component="span" sx={{ color: 'primary.main' }}>
                    Política de Privacidade
                  </Box>
                </Typography>
              }
              sx={{ m: 0, alignItems: 'center' }}
            />
            {fieldState.error && (
              <FormHelperText sx={{ ml: 0, fontFamily: registrationFontFamily.body }}>
                {fieldState.error.message}
              </FormHelperText>
            )}
          </FormControl>
        )}
      />

      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        sx={{
          ...authPrimaryButtonSx,
          width: '100%',
          maxWidth: 286,
          mt: 3.25,
          fontFamily: registrationFontFamily.body,
        }}
      >
        Criar conta
      </Button>
    </Box>
  )
}
