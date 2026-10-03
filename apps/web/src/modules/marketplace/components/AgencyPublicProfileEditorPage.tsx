'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { Controller, useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import { DashboardNotificationsButton, DashboardPageHeader } from '@shared/components/layout'

import {
  useOwnAgencyProfile,
  usePublishAgencyProfile,
  useSaveAgencyProfile,
  useUnpublishAgencyProfile,
} from '../hooks/use-agency-profile'
import { useTenantAgents } from '../hooks/use-tenant-agents'
import {
  agencyPublicProfileEditorSchema,
  type AgencyPublicProfileEditorFormValues,
} from '../schemas/agency-public-profile-editor-schema'
import type { AgencyProfile } from '../types/agency'
import type { PublicAgencyProfile } from '../types/public-agency-profile'
import { editorPanelSx } from './public-profile-editor/public-profile-editor-shared'
import { SingleImageUploadField } from './public-profile-editor/SingleImageUploadField'
import { AgencyPublicProfilePage } from './AgencyPublicProfilePage'

const emptyValues: AgencyPublicProfileEditorFormValues = {
  displayName: '',
  headline: '',
  summary: '',
  legalCreci: '',
  headquarters: '',
  address: '',
  phone: '',
  email: '',
  coverage: '',
  segments: '',
  yearsInMarket: '',
  backgroundColor: '',
  logoUrl: '',
  bannerUrl: '',
  team: [],
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function toDraft(values: AgencyPublicProfileEditorFormValues) {
  return {
    displayName: values.displayName,
    headline: values.headline || null,
    summary: values.summary || null,
    legalCreci: values.legalCreci || null,
    headquarters: values.headquarters || null,
    address: values.address || null,
    phone: values.phone || null,
    email: values.email || null,
    coverage: splitList(values.coverage),
    segments: splitList(values.segments),
    yearsInMarket: values.yearsInMarket ? Number(values.yearsInMarket) : null,
    backgroundColor: values.backgroundColor || null,
    logoUrl: values.logoUrl || null,
    bannerUrl: values.bannerUrl || null,
    team: values.team.map((member, index) => ({ usuarioId: member.usuarioId, order: index })),
  }
}

function toFormValues(profile: PublicAgencyProfile | null): AgencyPublicProfileEditorFormValues {
  if (!profile) return emptyValues

  return {
    displayName: profile.displayName,
    headline: profile.headline ?? '',
    summary: profile.summary ?? '',
    legalCreci: profile.legalCreci ?? '',
    headquarters: profile.headquarters ?? '',
    address: profile.address ?? '',
    phone: profile.phone ?? '',
    email: profile.email ?? '',
    coverage: profile.coverage.join(', '),
    segments: profile.segments.join(', '),
    yearsInMarket: profile.yearsInMarket ? String(profile.yearsInMarket) : '',
    backgroundColor: profile.backgroundColor ?? '',
    logoUrl: profile.logoUrl ?? '',
    bannerUrl: profile.bannerUrl ?? '',
    team: profile.team
      .slice()
      .sort((first, second) => first.order - second.order)
      .map((member) => ({ usuarioId: member.usuarioId, name: member.name })),
  }
}

function toPreviewProfile(
  values: AgencyPublicProfileEditorFormValues,
  profile: PublicAgencyProfile | null,
): AgencyProfile {
  return {
    id: profile?.id ?? 'preview',
    name: values.displayName || 'Sua imobiliária',
    headline: values.headline || null,
    legalCreci: values.legalCreci || null,
    logoInitials: (values.displayName || '?').slice(0, 2).toUpperCase(),
    bannerUrl: values.bannerUrl || null,
    brand: {
      primaryColor: profile?.primaryColor ?? null,
      secondaryColor: profile?.secondaryColor ?? null,
      backgroundColor: values.backgroundColor || null,
      logoUrl: values.logoUrl || null,
    },
    headquarters: values.headquarters || null,
    address: values.address || null,
    coverage: splitList(values.coverage),
    segments: splitList(values.segments),
    activeListings: profile?.stats.activeListings ?? 0,
    brokersCount: profile?.stats.brokersCount ?? 0,
    dealsClosed: profile?.stats.dealsClosed ?? 0,
    responseTime: null,
    yearsInMarket: values.yearsInMarket ? Number(values.yearsInMarket) : null,
    rating: null,
    phone: values.phone || null,
    email: values.email || null,
    summary: values.summary || null,
    href: profile ? `/agencies/${profile.id}` : '',
    teamHighlights: values.team.map((member) => ({
      usuarioId: member.usuarioId,
      name: member.name,
      avatarUrl: null,
    })),
    featuredListings: (profile?.featuredListings ?? []).map((listing) => ({
      title: listing.title,
      location: [listing.neighborhood, listing.city].filter(Boolean).join(', '),
      price: String(listing.price),
      href: `/properties/${listing.id}`,
    })),
  }
}

export function AgencyPublicProfileEditorPage() {
  const t = useTranslations('marketplace.agencyProfileEditor')
  const { enqueueSnackbar } = useSnackbar()
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const { data: profile } = useOwnAgencyProfile()
  const { data: tenantAgents } = useTenantAgents()
  const saveProfile = useSaveAgencyProfile()
  const publishProfile = usePublishAgencyProfile()
  const unpublishProfile = useUnpublishAgencyProfile()

  const { control, handleSubmit, reset, watch } = useForm<AgencyPublicProfileEditorFormValues>({
    defaultValues: emptyValues,
    resolver: zodResolver(agencyPublicProfileEditorSchema),
  })

  useEffect(() => {
    reset(toFormValues(profile ?? null))
  }, [profile, reset])

  const draft = watch()

  function onSubmit(values: AgencyPublicProfileEditorFormValues) {
    saveProfile.mutate(toDraft(values), {
      onSuccess: () => enqueueSnackbar(t('saveSuccess'), { variant: 'success' }),
      onError: () => enqueueSnackbar(t('saveError'), { variant: 'error' }),
    })
  }

  function handlePublishToggle() {
    if (profile?.status === 'PUBLISHED') {
      unpublishProfile.mutate(undefined, {
        onSuccess: () => enqueueSnackbar(t('unpublishSuccess'), { variant: 'success' }),
        onError: () => enqueueSnackbar(t('publishError'), { variant: 'error' }),
      })
      return
    }

    publishProfile.mutate(undefined, {
      onSuccess: () => enqueueSnackbar(t('publishSuccess'), { variant: 'success' }),
      onError: () => enqueueSnackbar(t('publishError'), { variant: 'error' }),
    })
  }

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <DashboardPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <DashboardNotificationsButton />
          </Box>
        }
        sx={{ mb: 2.6 }}
      />

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 3fr) minmax(420px, 2fr)' },
            alignItems: { xs: 'start', xl: 'stretch' },
            columnGap: { xs: 2.2, xl: 4 },
            rowGap: 2.2,
          }}
        >
          <Box sx={{ ...editorPanelSx, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              {t('fields.mainInfo')}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                gap: 1.6,
                flex: 1,
              }}
            >
              <RhfTextField
                control={control}
                name="headline"
                label={t('fields.headline')}
                sx={{ gridColumn: { md: '1 / -1' } }}
              />
              <RhfTextField control={control} name="displayName" label={t('fields.displayName')} />
              <RhfTextField control={control} name="legalCreci" label={t('fields.legalCreci')} />
              <RhfTextField
                control={control}
                name="headquarters"
                label={t('fields.headquarters')}
              />
              <RhfTextField control={control} name="address" label={t('fields.address')} />
              <RhfTextField control={control} name="phone" label={t('fields.phone')} />
              <RhfTextField control={control} name="email" label={t('fields.email')} />
              <RhfTextField
                control={control}
                name="coverage"
                label={t('fields.coverage')}
                helperText={t('fields.commaSeparatedHint')}
              />
              <RhfTextField
                control={control}
                name="segments"
                label={t('fields.segments')}
                helperText={t('fields.commaSeparatedHint')}
              />
              <RhfTextField
                control={control}
                name="yearsInMarket"
                label={t('fields.yearsInMarket')}
              />
              <RhfTextField
                control={control}
                name="summary"
                label={t('fields.summary')}
                multiline
                minRows={6}
                fullWidth
                sx={{
                  gridColumn: { md: '1 / -1' },
                  '& .MuiInputBase-root': { alignItems: 'flex-start', height: { xl: '100%' } },
                  '& textarea': { height: { xl: '100% !important' } },
                }}
              />
            </Box>
          </Box>

          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                type="button"
                variant="outlined"
                startIcon={<VisibilityOutlinedIcon />}
                onClick={() => setIsPreviewOpen(true)}
                sx={{ flex: 1 }}
              >
                {t('actions.preview')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={saveProfile.isPending}
                sx={{ flex: 1 }}
              >
                {t('actions.save')}
              </Button>
              {profile ? (
                <Button
                  type="button"
                  variant="outlined"
                  color={profile.status === 'PUBLISHED' ? 'error' : 'success'}
                  onClick={handlePublishToggle}
                  disabled={publishProfile.isPending || unpublishProfile.isPending}
                  sx={{ flex: 1 }}
                >
                  {profile.status === 'PUBLISHED' ? t('actions.unpublish') : t('actions.publish')}
                </Button>
              ) : null}
            </Stack>

            <Box sx={editorPanelSx}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {t('fields.appearance')}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                  gap: 1.6,
                }}
              >
                <RhfTextField
                  control={control}
                  name="backgroundColor"
                  label={t('fields.backgroundColor')}
                  type="color"
                />
              </Box>
            </Box>

            <Box sx={editorPanelSx}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {t('fields.images')}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  alignItems: 'stretch',
                  gap: 1.6,
                }}
              >
                <SingleImageUploadField
                  control={control}
                  name="logoUrl"
                  label={t('fields.logoUrl')}
                  target="agency-logo"
                  variant="avatar"
                />
                <SingleImageUploadField
                  control={control}
                  name="bannerUrl"
                  label={t('fields.bannerUrl')}
                  target="agency-banner"
                  variant="banner"
                />
              </Box>
            </Box>
          </Stack>

          <Box sx={{ ...editorPanelSx, gridColumn: { xl: '1 / -1' } }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              {t('fields.team')}
            </Typography>
            <Controller
              control={control}
              name="team"
              render={({ field }) => (
                <Autocomplete
                  multiple
                  options={tenantAgents ?? []}
                  value={(tenantAgents ?? []).filter((agent) =>
                    field.value.some((member) => member.usuarioId === agent.id),
                  )}
                  getOptionLabel={(agent) => agent.name}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={(_event, selected) =>
                    field.onChange(
                      selected
                        .slice(0, 6)
                        .map((agent) => ({ usuarioId: agent.id, name: agent.name })),
                    )
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('fields.teamPicker')}
                      placeholder={t('fields.teamPickerPlaceholder')}
                    />
                  )}
                />
              )}
            />
          </Box>
        </Box>
      </Box>

      <Dialog open={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} maxWidth="lg" fullWidth>
        <DialogContent sx={{ p: 0 }}>
          <AgencyPublicProfilePage agency={toPreviewProfile(draft, profile ?? null)} />
        </DialogContent>
      </Dialog>
    </Box>
  )
}
