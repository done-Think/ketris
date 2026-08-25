'use client'

import type { MouseEvent } from 'react'
import AddTaskOutlinedIcon from '@mui/icons-material/AddTaskOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined'
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined'
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined'
import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  GlobalStyles,
  Link,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import NextLink from 'next/link'

import {
  alpha,
  brand,
  componentText,
  iconSize,
  motion,
  radius,
  shadows,
  surface,
  zIndex,
} from '@shared/theme/tokens'

import type {
  OpportunityActivityKind,
  OpportunityDetailPresentation,
  OpportunityDetailStagePresentation,
  OpportunityNextActionKind,
  SuggestedPropertyPresentation,
} from '../types/opportunity-detail'
import type { Opportunity } from '../types/opportunity'

export type OpportunityDetailContentProps = {
  opportunity: Opportunity
  stage: OpportunityDetailStagePresentation
  presentation: OpportunityDetailPresentation
  valueLabel: string
  suggestionsLoading?: boolean
  suggestionsError?: boolean
  isMutating: boolean
  actionsDisabled?: boolean
  primaryActionLabel: string
  onPrimaryAction: (event: MouseEvent<HTMLButtonElement>) => void
  onDiscardOpportunity: () => void
  onAddQuickNote: () => void
  onRetrySuggestions?: () => void
}

const panelSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: `${radius.md}px`,
  bgcolor: surface.paper,
  boxShadow: shadows.crmDetailPanel,
} as const

const sectionTitleSx = {
  ...componentText.sectionAction,
  fontWeight: 800,
  lineHeight: 1.25,
  letterSpacing: 0,
} as const

const detailLabelSx = {
  ...componentText.miniCardMeta,
  color: brand.neutral[400],
  fontWeight: 800,
  lineHeight: 1.25,
  textTransform: 'uppercase',
} as const

const detailValueSx = {
  ...componentText.cardMeta,
  minWidth: 0,
  color: 'text.primary',
  fontWeight: 500,
  lineHeight: 1.45,
  overflowWrap: 'anywhere',
} as const

function ActivityIcon({ kind }: { kind: OpportunityActivityKind }) {
  const iconSx = { fontSize: iconSize.sm }

  if (kind === 'phone') return <PhoneInTalkOutlinedIcon sx={iconSx} />
  if (kind === 'email') return <EmailOutlinedIcon sx={iconSx} />

  return <RocketLaunchOutlinedIcon sx={iconSx} />
}

function NextActionIcon({ kind }: { kind: OpportunityNextActionKind }) {
  return kind === 'visit' ? (
    <CalendarMonthOutlinedIcon sx={{ fontSize: iconSize.sm }} />
  ) : (
    <AddTaskOutlinedIcon sx={{ fontSize: iconSize.sm }} />
  )
}

function PropertyArtwork({ property }: { property: SuggestedPropertyPresentation }) {
  if (!property.imageUrl) {
    return (
      <Box
        aria-hidden="true"
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: { xs: 52, sm: 60 },
          height: { xs: 52, sm: 60 },
          flexShrink: 0,
          borderRadius: `${radius.sm}px`,
          bgcolor: brand.neutral[100],
          color: brand.neutral[400],
        }}
      >
        <HomeWorkOutlinedIcon sx={{ fontSize: iconSize.xl }} />
      </Box>
    )
  }

  return (
    <Box
      component="img"
      src={property.imageUrl}
      alt=""
      aria-hidden="true"
      sx={{
        width: { xs: 52, sm: 60 },
        height: { xs: 52, sm: 60 },
        flexShrink: 0,
        borderRadius: `${radius.sm}px`,
        objectFit: 'cover',
      }}
    />
  )
}

function SuggestedPropertyRow({ property }: { property: SuggestedPropertyPresentation }) {
  const row = (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.1}
      sx={{
        minHeight: { xs: 72, sm: 80 },
        p: { xs: 1, sm: 1.25 },
        border: '1px solid',
        borderColor: brand.neutral[100],
        borderRadius: `${radius.sm}px`,
        bgcolor: surface.app,
        color: 'text.primary',
        transition: motion.transition.bordered,
        '&:hover': property.href
          ? { borderColor: alpha.magenta[14], bgcolor: alpha.magenta[6] }
          : undefined,
      }}
    >
      <PropertyArtwork property={property} />
      <Stack minWidth={0} flex={1} justifyContent="center">
        <Typography noWrap sx={{ ...componentText.miniCardTitle, fontWeight: 800 }}>
          {property.title}
        </Typography>
        <Typography
          noWrap
          title={property.meta}
          sx={{ ...componentText.miniCardMeta, mt: 0.25, color: 'text.secondary', lineHeight: 1.3 }}
        >
          {property.meta}
        </Typography>
        <Typography sx={{ ...componentText.cardMeta, mt: 0.25, fontWeight: 800, lineHeight: 1.3 }}>
          {property.priceLabel}
        </Typography>
      </Stack>
      {property.matchPercentage !== undefined && (
        <Chip
          label={`${property.matchPercentage}% Match`}
          size="small"
          sx={{
            height: 22,
            flexShrink: 0,
            borderRadius: `${radius.sm}px`,
            bgcolor: brand.magenta[50],
            color: 'primary.main',
            fontSize: componentText.miniCardMeta.fontSize,
            fontWeight: 800,
            '& .MuiChip-label': { px: 1 },
          }}
        />
      )}
    </Stack>
  )

  if (!property.href) return row

  return (
    <Link
      component={NextLink}
      href={property.href}
      aria-label={`Abrir imóvel ${property.title}`}
      underline="none"
      sx={{ display: 'block', borderRadius: `${radius.sm}px` }}
    >
      {row}
    </Link>
  )
}

type ContactInterestCardProps = {
  opportunity: Opportunity
  interestDetails: OpportunityDetailPresentation['interestDetails']
}

function ContactInterestCard({ opportunity, interestDetails }: ContactInterestCardProps) {
  const contactDetails = [
    { label: 'Email', value: opportunity.interessadoEmail },
    { label: 'Telefone', value: opportunity.interessadoTelefone ?? 'Não informado' },
    { label: 'Interesse', value: interestDetails.interest },
    { label: 'Orçamento', value: interestDetails.budget },
    { label: 'Prazo', value: interestDetails.deadline },
  ]

  return (
    <Paper
      component="section"
      aria-labelledby="contact-interest-title"
      elevation={0}
      sx={{
        ...panelSx,
        display: 'flex',
        minHeight: { xs: 224, sm: 236 },
        flexDirection: 'column',
        p: { xs: 2, sm: 2.5 },
      }}
    >
      <Typography id="contact-interest-title" component="h2" sx={sectionTitleSx}>
        Informações de Contato &amp; Interesse
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '88px minmax(0, 1fr)', sm: '112px minmax(0, 1fr)' },
          alignContent: 'space-between',
          rowGap: 1,
          flex: 1,
          mt: 2,
        }}
      >
        {contactDetails.map((detail) => (
          <Box key={detail.label} sx={{ display: 'contents' }}>
            <Typography sx={detailLabelSx}>{detail.label}</Typography>
            <Typography sx={detailValueSx}>{detail.value}</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

type SuggestedPropertiesCardProps = {
  properties: readonly SuggestedPropertyPresentation[]
  isLoading: boolean
  isError: boolean
  onRetry?: () => void
}

function SuggestedPropertiesCard({
  properties,
  isLoading,
  isError,
  onRetry,
}: SuggestedPropertiesCardProps) {
  return (
    <Paper
      component="section"
      aria-labelledby="suggested-properties-title"
      elevation={0}
      sx={{
        ...panelSx,
        minHeight: { xs: 300, sm: 326 },
        p: { xs: 2, sm: 2.5 },
      }}
    >
      <Typography id="suggested-properties-title" component="h2" sx={sectionTitleSx}>
        Imóveis Sugeridos
      </Typography>
      <Stack spacing={1.25} sx={{ mt: 2 }}>
        {isLoading
          ? Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} variant="rounded" sx={{ height: { xs: 72, sm: 80 } }} />
            ))
          : null}
        {!isLoading && isError ? (
          <Alert
            severity="warning"
            action={
              onRetry ? (
                <Button size="small" onClick={onRetry}>
                  Tentar novamente
                </Button>
              ) : undefined
            }
            sx={componentText.cardMeta}
          >
            Não foi possível carregar os imóveis relacionados.
          </Alert>
        ) : null}
        {!isLoading && !isError
          ? properties.map((property) => (
              <SuggestedPropertyRow key={property.id} property={property} />
            ))
          : null}
        {!isLoading && !isError && properties.length === 0 ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={0.8}
            sx={{ minHeight: 252, color: 'text.disabled' }}
          >
            <HomeWorkOutlinedIcon sx={{ fontSize: iconSize.xl }} />
            <Typography sx={{ ...componentText.cardMeta, fontWeight: 700 }}>
              Nenhum imóvel relacionado disponível
            </Typography>
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  )
}

type RecentActivitiesCardProps = {
  activities: OpportunityDetailPresentation['activities']
}

function RecentActivitiesCard({ activities }: RecentActivitiesCardProps) {
  return (
    <Paper
      component="section"
      aria-labelledby="recent-activities-title"
      elevation={0}
      sx={{
        ...panelSx,
        display: 'flex',
        minHeight: { xs: 360, sm: 376 },
        flexDirection: 'column',
        p: { xs: 2, sm: 2.5 },
      }}
    >
      <Typography id="recent-activities-title" component="h2" sx={sectionTitleSx}>
        Atividades Recentes
      </Typography>
      <Stack justifyContent="space-between" sx={{ flex: 1, mt: 2 }}>
        {activities.map((activity, index) => (
          <Stack key={activity.id} direction="row" spacing={1.25} sx={{ flex: 1 }}>
            <Stack alignItems="center">
              <Avatar
                aria-hidden="true"
                sx={{
                  width: 30,
                  height: 30,
                  bgcolor: surface.app,
                  color: brand.neutral[500],
                }}
              >
                <ActivityIcon kind={activity.kind} />
              </Avatar>
              {index < activities.length - 1 && (
                <Box sx={{ width: '1px', minHeight: 44, flex: 1, bgcolor: 'divider' }} />
              )}
            </Stack>
            <Box
              sx={{
                minWidth: 0,
                flex: 1,
                pb: index < activities.length - 1 ? 2 : 0,
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'baseline' }}
                justifyContent="space-between"
                gap={{ xs: 0.25, sm: 1 }}
              >
                <Typography sx={{ ...componentText.miniCardTitle, fontWeight: 800 }}>
                  {activity.title}
                </Typography>
                <Typography
                  color="text.disabled"
                  sx={{ ...componentText.miniCardMeta, flexShrink: 0, lineHeight: 1.35 }}
                >
                  {activity.dateLabel}
                </Typography>
              </Stack>
              <Typography
                color="text.secondary"
                sx={{ ...componentText.cardMeta, mt: 0.5, lineHeight: 1.4 }}
              >
                {activity.description}
              </Typography>
            </Box>
          </Stack>
        ))}
        {activities.length === 0 && (
          <Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
            <Typography
              color="text.disabled"
              sx={{ ...componentText.miniCardTitle, fontWeight: 700 }}
            >
              Nenhuma atividade registrada
            </Typography>
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}

type NextActionsCardProps = {
  actions: OpportunityDetailPresentation['nextActions']
}

function NextActionsCard({ actions }: NextActionsCardProps) {
  return (
    <Paper
      component="section"
      aria-labelledby="next-actions-title"
      elevation={0}
      sx={{
        ...panelSx,
        minHeight: { xs: 190, sm: 204 },
        p: { xs: 2, sm: 2.5 },
      }}
    >
      <Typography id="next-actions-title" component="h2" sx={sectionTitleSx}>
        Próximas Ações
      </Typography>
      <Stack spacing={1.25} sx={{ mt: 2 }}>
        {actions.map((action) => (
          <Stack
            key={action.id}
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              minHeight: { xs: 56, sm: 60 },
              px: 1.5,
              border: '1px solid',
              borderColor: brand.neutral[100],
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.app,
            }}
          >
            <Box sx={{ display: 'grid', placeItems: 'center', color: 'primary.main' }}>
              <NextActionIcon kind={action.kind} />
            </Box>
            <Box minWidth={0} flex={1}>
              <Typography noWrap sx={{ ...componentText.miniCardTitle, fontWeight: 800 }}>
                {action.title}
              </Typography>
              <Typography
                noWrap
                title={action.scheduleLabel}
                color="text.secondary"
                sx={{ ...componentText.miniCardMeta, mt: 0.25, lineHeight: 1.3 }}
              >
                {action.scheduleLabel}
              </Typography>
            </Box>
          </Stack>
        ))}
        {actions.length === 0 && (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ minHeight: 120, color: 'text.disabled' }}
          >
            <Typography sx={{ ...componentText.cardMeta, fontWeight: 700 }}>
              Nenhuma próxima ação cadastrada
            </Typography>
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}

type OpportunityActionBarProps = {
  opportunityStatus: Opportunity['status']
  isMutating: boolean
  actionsDisabled: boolean
  primaryActionLabel: string
  onPrimaryAction: (event: MouseEvent<HTMLButtonElement>) => void
  onDiscardOpportunity: () => void
  onAddQuickNote: () => void
}

function OpportunityActionBar({
  opportunityStatus,
  isMutating,
  actionsDisabled,
  primaryActionLabel,
  onPrimaryAction,
  onDiscardOpportunity,
  onAddQuickNote,
}: OpportunityActionBarProps) {
  const controlsDisabled = actionsDisabled || isMutating
  const preservePreviewAppearance = actionsDisabled && !isMutating

  return (
    <Paper
      component="footer"
      elevation={0}
      sx={{
        position: { md: 'sticky' },
        bottom: { md: 8 },
        zIndex: zIndex.content,
        minHeight: 64,
        mx: { xs: 2, sm: 2.5, lg: 3.5 },
        mt: 'auto',
        mb: 0.5,
        px: { xs: 2, sm: 2.25 },
        py: 1.25,
        border: '1px solid',
        borderColor: alpha.graphite[6],
        borderRadius: `${radius.md}px`,
        bgcolor: surface.paper,
        boxShadow: shadows.crmCard,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        gap={1}
        sx={{ minHeight: 44 }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
          <Button
            variant="contained"
            startIcon={<DoneAllRoundedIcon />}
            disabled={controlsDisabled}
            onClick={onPrimaryAction}
            sx={{
              ...componentText.cardAction,
              minHeight: { xs: 44, sm: 40 },
              px: 1.75,
              borderRadius: `${radius.sm}px`,
              fontWeight: 800,
              '& .MuiButton-startIcon > :nth-of-type(1)': { fontSize: iconSize.sm },
              ...(preservePreviewAppearance
                ? {
                    '&.Mui-disabled': {
                      bgcolor: brand.magenta[500],
                      color: surface.lightText,
                      opacity: 1,
                    },
                  }
                : {}),
            }}
          >
            {primaryActionLabel}
          </Button>
          <Button
            color="error"
            variant="outlined"
            disabled={controlsDisabled || opportunityStatus === 'RECUSADA'}
            onClick={onDiscardOpportunity}
            sx={{
              ...componentText.cardAction,
              minHeight: { xs: 44, sm: 40 },
              px: 1.5,
              borderRadius: `${radius.sm}px`,
              fontWeight: 700,
              ...(preservePreviewAppearance
                ? {
                    '&.Mui-disabled': {
                      borderColor: brand.semantic.error,
                      color: brand.semantic.error,
                      opacity: 1,
                    },
                  }
                : {}),
            }}
          >
            Descartar Lead
          </Button>
        </Stack>
        <Button
          color="inherit"
          startIcon={<NoteAddOutlinedIcon />}
          disabled={controlsDisabled}
          onClick={onAddQuickNote}
          sx={{
            ...componentText.cardAction,
            minHeight: { xs: 44, sm: 40 },
            px: 1,
            color: 'text.secondary',
            fontWeight: 600,
            '& .MuiButton-startIcon > :nth-of-type(1)': { fontSize: iconSize.sm },
            ...(preservePreviewAppearance
              ? {
                  '&.Mui-disabled': {
                    color: 'text.secondary',
                    opacity: 1,
                  },
                }
              : {}),
          }}
        >
          Adicionar Nota Rápida
        </Button>
      </Stack>
    </Paper>
  )
}

export function OpportunityDetailContent({
  opportunity,
  stage,
  presentation,
  valueLabel,
  suggestionsLoading = false,
  suggestionsError = false,
  isMutating,
  actionsDisabled = false,
  primaryActionLabel,
  onPrimaryAction,
  onDiscardOpportunity,
  onAddQuickNote,
  onRetrySuggestions,
}: OpportunityDetailContentProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: { xs: 'calc(100vh - 64px)', md: '100vh' },
        flexDirection: 'column',
        pb: 1,
        '& h1, & h2': { letterSpacing: '0 !important' },
      }}
    >
      <GlobalStyles
        styles={{
          '.tsqd-parent-container, .tsqd-open-btn-container': { display: 'none !important' },
        }}
      />

      <Box
        sx={{
          px: { xs: 2, sm: 2.5, lg: 3.5 },
          pt: { xs: 2, sm: 2.5, lg: 3 },
          pb: { xs: 2.5, lg: 3 },
        }}
      >
        <Breadcrumbs
          aria-label="Navegação estrutural"
          separator="›"
          sx={{
            mb: 1,
            fontSize: { xs: 10.5, sm: 11.5 },
            lineHeight: 1.4,
            '& .MuiBreadcrumbs-separator': { mx: 0.7, color: 'text.disabled' },
          }}
        >
          <Link
            component={NextLink}
            href="/crm"
            underline="hover"
            color="text.secondary"
            sx={{ fontSize: 'inherit' }}
          >
            Pipeline
          </Link>
          <Typography color="text.secondary" sx={{ fontSize: 'inherit' }}>
            {stage.label}
          </Typography>
          <Typography color="text.primary" sx={{ fontSize: 'inherit', fontWeight: 700 }}>
            {opportunity.interessadoNome}
          </Typography>
        </Breadcrumbs>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          gap={1}
          sx={{ mb: { xs: 2, md: 2.5 } }}
        >
          <Stack direction="row" alignItems="center" spacing={1.1} flexWrap="wrap" useFlexGap>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: 24, sm: 28, lg: 32 },
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              {opportunity.interessadoNome}
            </Typography>
            <Chip
              size="small"
              label={stage.label}
              sx={{
                height: 22,
                borderRadius: `${radius.sm}px`,
                bgcolor: stage.softColor,
                color: stage.color,
                fontSize: componentText.miniCardMeta.fontSize,
                fontWeight: 800,
                '& .MuiChip-label': { px: 1 },
              }}
            />
          </Stack>
          <Typography
            sx={{
              color: 'primary.main',
              fontSize: { xs: 22, sm: 26, lg: 28 },
              fontWeight: 900,
              lineHeight: 1.2,
            }}
          >
            {valueLabel}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              lg: 'minmax(0, 58fr) minmax(320px, 42fr)',
            },
            gap: { xs: 2, md: 2.5, lg: 3 },
            alignItems: 'start',
          }}
        >
          <Stack spacing={{ xs: 2, md: 2.5, lg: 3 }} minWidth={0}>
            <ContactInterestCard
              opportunity={opportunity}
              interestDetails={presentation.interestDetails}
            />
            <SuggestedPropertiesCard
              properties={presentation.suggestedProperties}
              isLoading={suggestionsLoading}
              isError={suggestionsError}
              onRetry={onRetrySuggestions}
            />
          </Stack>

          <Stack spacing={{ xs: 2, md: 2.5, lg: 3 }} minWidth={0}>
            <RecentActivitiesCard activities={presentation.activities} />
            <NextActionsCard actions={presentation.nextActions} />
          </Stack>
        </Box>
      </Box>

      <OpportunityActionBar
        opportunityStatus={opportunity.status}
        isMutating={isMutating}
        actionsDisabled={actionsDisabled}
        primaryActionLabel={primaryActionLabel}
        onPrimaryAction={onPrimaryAction}
        onDiscardOpportunity={onDiscardOpportunity}
        onAddQuickNote={onAddQuickNote}
      />
    </Box>
  )
}
