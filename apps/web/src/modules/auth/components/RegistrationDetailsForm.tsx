'use client'

import { styles } from '../styles/registration-details-form.styles'

import { useMemo, useState } from 'react'
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
import { useTranslations } from 'next-intl'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { RhfMaskedTextField, RhfTextField } from '@shared/components/form'

import { AgencyAutocomplete } from './AgencyAutocomplete'
import { AuthFormField } from '@shared/components/form/AuthFormField'
import { authTextFieldSx } from '@shared/components/form/auth-form.styles'
import { createRegistrationDetailsSchema } from '../schemas/registration-details-schema'
import type {
  AgencySearchResult,
  RegistrationDetailsFormProps,
  RegistrationDetailsFormValues,
  RegistrationPasswordField,
  RegistrationPasswordFieldName,
} from '../types/registration'

const PHONE_MASK = [{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }]
const CPF_MASK = [{ mask: '000.000.000-00' }]
const CNPJ_MASK = [{ mask: '00.000.000/0000-00' }]
// One field for both: the mask follows what is typed, up to 11 digits it is a CPF, beyond that a CNPJ.
const DOCUMENT_MASK = [...CPF_MASK, ...CNPJ_MASK]

const passwordFields: ReadonlyArray<RegistrationPasswordField> = [
  { name: 'password', translationKey: 'password' },
  { name: 'passwordConfirmation', translationKey: 'passwordConfirmation' },
]

export function RegistrationDetailsForm({ profile, onSubmit }: RegistrationDetailsFormProps) {
  const t = useTranslations('auth.registerDetails')
  const [visiblePasswordFields, setVisiblePasswordFields] = useState<
    ReadonlySet<RegistrationPasswordFieldName>
  >(new Set())
  const [selectedAgency, setSelectedAgency] = useState<AgencySearchResult | null>(null)
  const registrationDetailsSchema = useMemo(
    () => createRegistrationDetailsSchema((key) => t(`errors.${key}`)),
    [t],
  )
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
      cpf: '',
      cnpj: '',
      document: '',
      companyName: '',
      acceptTerms: false,
    },
  })

  const showCnpj = profile === 'agency' || profile === 'developer' || profile === 'condoManager'
  const showCreci = profile === 'broker' || profile === 'agency'
  const showCompanyName =
    profile === 'agency' ||
    profile === 'developer' ||
    profile === 'condoManager' ||
    profile === 'broker'

  const acceptTerms = useWatch({ control, name: 'acceptTerms' })

  function submitDetails(values: RegistrationDetailsFormValues) {
    onSubmit?.(values)
  }

  function togglePasswordVisibility(fieldName: RegistrationPasswordFieldName) {
    setVisiblePasswordFields((current) => {
      const next = new Set(current)
      if (next.has(fieldName)) {
        next.delete(fieldName)
      } else {
        next.add(fieldName)
      }
      return next
    })
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(submitDetails)} sx={styles.box}>
      <Box sx={styles.box2}>
        <AuthFormField htmlFor="registration-full-name" label={t('fullName.label')} required>
          <RhfTextField
            id="registration-full-name"
            control={control}
            name="fullName"
            placeholder={t('fullName.placeholder')}
            autoComplete="name"
            fullWidth
            sx={authTextFieldSx}
          />
        </AuthFormField>

        {showCompanyName ? (
          <AuthFormField htmlFor="registration-company-name" label={t('companyName.label')}>
            <RhfTextField
              id="registration-company-name"
              control={control}
              name="companyName"
              placeholder={t('companyName.placeholder')}
              helperText={t('companyName.helper')}
              fullWidth
              sx={authTextFieldSx}
            />
          </AuthFormField>
        ) : null}

        <Box sx={styles.box3}>
          <AuthFormField htmlFor="registration-email" label={t('email.label')} required>
            <RhfTextField
              id="registration-email"
              control={control}
              name="email"
              placeholder={t('email.placeholder')}
              type="email"
              autoComplete="email"
              fullWidth
              sx={authTextFieldSx}
            />
          </AuthFormField>

          <AuthFormField htmlFor="registration-phone" label={t('phone.label')} required>
            <RhfMaskedTextField
              id="registration-phone"
              control={control}
              name="phone"
              mask={PHONE_MASK}
              placeholder={t('phone.placeholder')}
              type="tel"
              autoComplete="tel"
              fullWidth
              sx={authTextFieldSx}
            />
          </AuthFormField>
        </Box>

        {profile === 'broker' ? (
          <AuthFormField htmlFor="registration-document" label={t('document.label')} required>
            <RhfMaskedTextField
              id="registration-document"
              control={control}
              name="document"
              mask={DOCUMENT_MASK}
              placeholder={t('document.placeholder')}
              inputMode="numeric"
              fullWidth
              sx={authTextFieldSx}
            />
          </AuthFormField>
        ) : showCnpj ? (
          <AuthFormField htmlFor="registration-cnpj" label={t('cnpj.label')} required>
            <RhfMaskedTextField
              id="registration-cnpj"
              control={control}
              name="cnpj"
              mask={CNPJ_MASK}
              placeholder={t('cnpj.placeholder')}
              inputMode="numeric"
              fullWidth
              sx={authTextFieldSx}
            />
          </AuthFormField>
        ) : (
          <AuthFormField htmlFor="registration-cpf" label={t('cpf.label')} required>
            <RhfMaskedTextField
              id="registration-cpf"
              control={control}
              name="cpf"
              mask={CPF_MASK}
              placeholder={t('cpf.placeholder')}
              inputMode="numeric"
              fullWidth
              sx={authTextFieldSx}
            />
          </AuthFormField>
        )}

        <Box sx={styles.box4}>
          {passwordFields.map((field) => {
            const isVisible = visiblePasswordFields.has(field.name)
            const label = t(`${field.translationKey}.label`)

            return (
              <AuthFormField
                key={field.name}
                htmlFor={`registration-${field.name}`}
                label={label}
                required
              >
                <RhfTextField
                  id={`registration-${field.name}`}
                  control={control}
                  name={field.name}
                  placeholder={t(`${field.translationKey}.placeholder`)}
                  type={isVisible ? 'text' : 'password'}
                  autoComplete="new-password"
                  fullWidth
                  sx={authTextFieldSx}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={t(
                              isVisible ? 'passwordVisibility.hide' : 'passwordVisibility.show',
                              { field: label },
                            )}
                            edge="end"
                            size="small"
                            onClick={() => togglePasswordVisibility(field.name)}
                            sx={styles.iconButton}
                          >
                            {isVisible ? (
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
            )
          })}
        </Box>

        {showCreci ? (
          <AuthFormField
            htmlFor="registration-creci"
            label={t('creci.label')}
            required={profile === 'broker'}
          >
            <RhfTextField
              id="registration-creci"
              control={control}
              name="creci"
              placeholder={t('creci.placeholder')}
              helperText={
                profile === 'broker' ? t('creci.requiredHelper') : t('creci.optionalHelper')
              }
              fullWidth
              sx={authTextFieldSx}
            />
          </AuthFormField>
        ) : null}

        {profile === 'broker' ? (
          <Controller
            control={control}
            name="agencyId"
            render={({ field }) => (
              <AgencyAutocomplete
                value={selectedAgency}
                onChange={(agency) => {
                  setSelectedAgency(agency)
                  field.onChange(agency?.id)
                }}
              />
            )}
          />
        ) : null}
      </Box>

      <Controller
        control={control}
        name="acceptTerms"
        render={({ field, fieldState }) => (
          <FormControl error={Boolean(fieldState.error)} sx={styles.formControl}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={field.value}
                  inputRef={field.ref}
                  name={field.name}
                  onBlur={field.onBlur}
                  onChange={(_, checked) => field.onChange(checked)}
                  size="small"
                  sx={styles.checkbox}
                />
              }
              label={
                <Typography color="text.secondary" variant="body2">
                  {t('terms.prefix')}{' '}
                  <Box component="span" sx={styles.box5}>
                    {t('terms.termsOfUse')}
                  </Box>{' '}
                  {t('terms.connector')}{' '}
                  <Box component="span" sx={styles.box6}>
                    {t('terms.privacyPolicy')}
                  </Box>
                </Typography>
              }
              sx={styles.formControlLabel}
            />
            {fieldState.error && (
              <FormHelperText sx={styles.formHelperText}>{fieldState.error.message}</FormHelperText>
            )}
          </FormControl>
        )}
      />

      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting || !acceptTerms}
        sx={styles.button}
      >
        {t('submit')}
      </Button>
    </Box>
  )
}
