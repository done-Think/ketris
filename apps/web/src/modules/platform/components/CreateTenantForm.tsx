'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSnackbar } from 'notistack'
import { useTranslations } from 'next-intl'

import { Link, useRouter } from '@/i18n/navigation'
import { RhfTextField } from '@shared/components/form'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'
import { extractErrorMessage } from '@shared/utils/error-message'

import { createTenantSchema } from '../schemas/create-tenant-schema'
import type { CreateTenantFormValues } from '../types/tenant'
import { useCreateTenant } from '../hooks/use-create-tenant'
import { slugifyTenantName } from '../utils/tenant-slug'

export function CreateTenantForm() {
  const t = useTranslations('platform.forms')
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const createTenant = useCreateTenant()
  const schema = useMemo(() => createTenantSchema((key) => t(`errors.${key}`)), [t])
  // The slug follows the name until the admin edits it by hand.
  const slugEditedByHand = useRef(false)

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting, isSubmitted },
  } = useForm<CreateTenantFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '' },
  })

  useEffect(() => {
    const subscription = watch((values, { name: field, type }) => {
      // Only react to what the admin types, not to the slug we set ourselves.
      if (type !== 'change') return
      if (field === 'slug') {
        // Clearing the field hands it back to the automatic suggestion.
        slugEditedByHand.current = Boolean(values.slug)
        return
      }
      if (field === 'name' && !slugEditedByHand.current) {
        setValue('slug', slugifyTenantName(values.name ?? ''), { shouldValidate: isSubmitted })
      }
    })

    return () => subscription.unsubscribe()
  }, [isSubmitted, setValue, watch])

  async function onSubmit(values: CreateTenantFormValues) {
    try {
      const tenant = await createTenant.mutateAsync(values)
      enqueueSnackbar(t('createTenantSuccess', { name: tenant.name }), { variant: 'success' })
      router.push({ pathname: '/platform/tenants/[id]', params: { id: tenant.id } })
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error, t('createTenantError')), { variant: 'error' })
    }
  }

  return (
    <Card
      variant="outlined"
      sx={{
        width: '100%',
        maxWidth: 720,
        bgcolor: surface.paper,
        borderColor: alpha.graphite[6],
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.propertyCard,
      }}
    >
      <Stack component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack direction="row" spacing={1.6} alignItems="center" sx={{ p: { xs: 2, md: 2.8 } }}>
          <Box
            aria-hidden
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: `${radius.sm}px`,
              bgcolor: alpha.magenta[8],
              color: brand.magenta[500],
            }}
          >
            <ApartmentOutlinedIcon sx={{ fontSize: iconSize.xl }} />
          </Box>
          <Box>
            <Typography
              component="h2"
              sx={{ color: brand.graphite[500], fontSize: 17, fontWeight: 900 }}
            >
              {t('tenantSectionTitle')}
            </Typography>
            <Typography sx={{ color: brand.neutral[500], fontSize: 13 }}>
              {t('tenantSectionDescription')}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ borderColor: alpha.graphite[6] }} />

        <Stack spacing={2.5} sx={{ p: { xs: 2, md: 2.8 } }}>
          <RhfTextField
            control={control}
            name="name"
            label={t('name')}
            placeholder={t('namePlaceholder')}
            fullWidth
            autoFocus
          />
          <RhfTextField
            control={control}
            name="slug"
            label={t('slugLabel')}
            placeholder={t('slugPlaceholder')}
            helperText={t('slugHelper')}
            fullWidth
          />

          <Stack
            direction="row"
            spacing={1}
            sx={{
              p: 1.5,
              borderRadius: `${radius.sm}px`,
              bgcolor: brand.neutral[100],
              color: brand.neutral[500],
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: iconSize.lg, mt: '1px', flexShrink: 0 }} />
            <Typography sx={{ fontSize: 13, lineHeight: 1.5 }}>{t('nextStepNotice')}</Typography>
          </Stack>

          {createTenant.isError ? (
            <Alert severity="error">
              {extractErrorMessage(createTenant.error, t('createTenantError'))}
            </Alert>
          ) : null}
        </Stack>

        <Divider sx={{ borderColor: alpha.graphite[6] }} />

        <Stack
          direction={{ xs: 'column-reverse', sm: 'row' }}
          justifyContent="flex-end"
          spacing={1.2}
          sx={{ p: { xs: 2, md: 2.2 }, px: { md: 2.8 } }}
        >
          <Button component={Link} href="/platform/tenants" variant="outlined" color="secondary">
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? <CircularProgress size={16} color="inherit" /> : <AddRoundedIcon />
            }
          >
            {t('createTenantSubmit')}
          </Button>
        </Stack>
      </Stack>
    </Card>
  )
}
