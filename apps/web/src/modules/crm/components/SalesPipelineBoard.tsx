'use client'

import { useMemo, useState } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useSession } from 'next-auth/react'

import { brand, radius, surface } from '@shared/theme/tokens'

import {
  salesPipelineFixtures,
  salesPipelineOrange,
  type SalesPipelineStageId,
} from '../fixtures/sales-pipeline-fixtures'
import { useCrmProperties, useOpportunities } from '../hooks/use-opportunities'
import type { Opportunity, OpportunityStatus } from '../types/opportunity'
import type { PublicPropertySummary } from '../types/property'
import { formatCurrency, formatMonthlyCurrency } from '../utils/formatters'
import { OpportunityCard } from './OpportunityCard'

type SalesPipelineStage = {
  id: SalesPipelineStageId
  label: string
  statuses: readonly OpportunityStatus[]
  color: string
  softColor: string
}

// Qualificação ainda não existe no contrato da API; a coluna fica pronta sem inventar dados.
// Fechado agrupa os dois desfechos finais, mantendo o indicador real de cada card.
const salesPipelineStages: readonly SalesPipelineStage[] = [
  {
    id: 'prospecting',
    label: 'Prospecção',
    statuses: ['RASCUNHO'],
    color: brand.magenta[500],
    softColor: brand.magenta[50],
  },
  {
    id: 'qualification',
    label: 'Qualificação',
    statuses: [],
    color: brand.semantic.info,
    softColor: '#EAF2FF',
  },
  {
    id: 'proposal',
    label: 'Proposta',
    statuses: ['ENVIADA'],
    color: brand.semantic.warning,
    softColor: '#FFF7DD',
  },
  {
    id: 'negotiation',
    label: 'Negociação',
    statuses: ['EM_NEGOCIACAO'],
    color: salesPipelineOrange,
    softColor: '#FFF0E6',
  },
  {
    id: 'closed',
    label: 'Fechado',
    statuses: ['ACEITA', 'RECUSADA'],
    color: brand.semantic.success,
    softColor: '#E7F7EE',
  },
] as const

const visibleStatuses = new Set(salesPipelineStages.flatMap((stage) => stage.statuses))
const pipelineBodyFontFamily = 'var(--font-inter), system-ui, -apple-system, sans-serif'
const pipelineStageLabelSx = {
  fontFamily: pipelineBodyFontFamily,
  fontSize: 10.5,
  fontWeight: 700,
  lineHeight: '14px',
  letterSpacing: 0,
  fontSynthesis: 'none',
  textTransform: 'uppercase',
} as const

const fixtureOpportunities = salesPipelineFixtures.map((fixture) => fixture.opportunity)
const fixtureProperties = salesPipelineFixtures.map((fixture) => fixture.property)
const fixtureStageByOpportunityId = new Map(
  salesPipelineFixtures.map((fixture) => [fixture.opportunity.id, fixture.stageId]),
)
const fixturePresentationByOpportunityId = new Map(
  salesPipelineFixtures.map((fixture) => [fixture.opportunity.id, fixture.presentation]),
)

function getOpportunityStageId(
  opportunity: Opportunity,
  fixtureMode: boolean,
): SalesPipelineStageId | undefined {
  if (fixtureMode) return fixtureStageByOpportunityId.get(opportunity.id)

  return salesPipelineStages.find((stage) => stage.statuses.includes(opportunity.status))?.id
}

function matchesSearch(
  opportunity: Opportunity,
  property: PublicPropertySummary | undefined,
  search: string,
): boolean {
  if (!search) return true

  return [
    opportunity.interessadoNome,
    opportunity.interessadoEmail,
    opportunity.interessadoTelefone,
    property?.titulo,
    property?.tipo,
    property?.bairro,
    property?.cidade,
    opportunity.imovelId,
  ].some((value) => value?.toLocaleLowerCase('pt-BR').includes(search))
}

function getProjectedTotals(
  opportunities: readonly Opportunity[],
  propertiesById: ReadonlyMap<string, PublicPropertySummary>,
) {
  const totals = opportunities.reduce(
    (result, opportunity) => {
      const purpose = propertiesById.get(opportunity.imovelId)?.finalidade

      if (purpose === 'ALUGUEL') result.rental += opportunity.valorProposto
      else if (purpose === 'VENDA') result.sale += opportunity.valorProposto
      else result.unclassified += opportunity.valorProposto

      return result
    },
    { rental: 0, sale: 0, unclassified: 0 },
  )

  return [
    ...(totals.rental ? [{ label: 'Aluguel', value: formatMonthlyCurrency(totals.rental) }] : []),
    ...(totals.sale ? [{ label: 'Venda', value: formatCurrency(totals.sale) }] : []),
    ...(totals.unclassified
      ? [{ label: 'Sem categoria', value: formatCurrency(totals.unclassified) }]
      : []),
  ]
}

type SalesPipelineBoardProps = {
  preview?: boolean
}

export function SalesPipelineBoard({ preview = false }: SalesPipelineBoardProps) {
  const { data: session, status: sessionStatus } = useSession()
  const fixtureMode = preview && process.env.NODE_ENV !== 'production'
  const tenantId = fixtureMode ? '' : (session?.tenantId ?? '')
  const [search, setSearch] = useState('')
  const [selectedStageId, setSelectedStageId] = useState<SalesPipelineStageId | null>(null)
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null)

  const opportunitiesQuery = useOpportunities(tenantId)
  const propertiesQuery = useCrmProperties(tenantId)

  const propertiesById = useMemo(
    () =>
      new Map(
        (fixtureMode ? fixtureProperties : (propertiesQuery.data ?? [])).map((property) => [
          property.id,
          property,
        ]),
      ),
    [fixtureMode, propertiesQuery.data],
  )

  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')
  const visibleOpportunities = useMemo(() => {
    const opportunities = fixtureMode ? fixtureOpportunities : (opportunitiesQuery.data ?? [])

    return opportunities.filter((opportunity) => {
      if (!fixtureMode && !visibleStatuses.has(opportunity.status)) return false

      const stageId = getOpportunityStageId(opportunity, fixtureMode)
      if (!stageId || (selectedStageId && stageId !== selectedStageId)) return false

      return matchesSearch(opportunity, propertiesById.get(opportunity.imovelId), normalizedSearch)
    })
  }, [fixtureMode, normalizedSearch, opportunitiesQuery.data, propertiesById, selectedStageId])

  const selectedStage = selectedStageId
    ? salesPipelineStages.find((stage) => stage.id === selectedStageId)
    : null
  const isPipelineLoading =
    !fixtureMode && (sessionStatus === 'loading' || opportunitiesQuery.isLoading)
  const hasPipelineError = !fixtureMode && (opportunitiesQuery.isError || propertiesQuery.isError)

  return (
    <Box
      sx={{
        minHeight: '100vh',
        p: { xs: 2, sm: 3, lg: 3.5 },
        bgcolor: surface.app,
        overflow: 'hidden',
        fontFamily: pipelineBodyFontFamily,
        '& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root': {
          fontFamily: pipelineBodyFontFamily,
        },
        '& h1.MuiTypography-root': {
          fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
        },
      }}
    >
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        alignItems={{ xs: 'stretch', lg: 'center' }}
        justifyContent="space-between"
        gap={1.5}
        sx={{
          flexWrap: { lg: 'nowrap' },
          mr: { lg: -1.75 },
          pb: 1.75,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ flexShrink: 0 }}>
          <Typography
            component="h1"
            sx={{
              fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
              fontSize: { xs: 26, sm: 30, xl: 32 },
              fontWeight: 700,
              lineHeight: { xs: 1.2, sm: 1.15 },
              letterSpacing: '-0.02em',
            }}
          >
            Pipeline de Vendas
          </Typography>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={1.25}
          sx={{ minWidth: 0, alignItems: { sm: 'center' }, flexWrap: { sm: 'wrap', lg: 'nowrap' } }}
        >
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar oportunidade..."
            size="small"
            inputProps={{ 'aria-label': 'Buscar oportunidade' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: 'text.disabled', fontSize: 16 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: '100%', sm: 210, xl: 224 },
              '& .MuiOutlinedInput-root': {
                height: { xs: 40, sm: 32 },
                borderRadius: `${radius.sm}px`,
                bgcolor: 'background.paper',
                fontSize: 12,
                '& fieldset': { borderColor: brand.neutral[100] },
                '&:hover fieldset': { borderColor: brand.neutral[200] },
              },
              '& .MuiInputBase-input::placeholder': {
                color: brand.neutral[400],
                opacity: 1,
              },
            }}
          />
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<FilterAltOutlinedIcon />}
            endIcon={<KeyboardArrowDownRoundedIcon />}
            onClick={(event) => setFilterAnchor(event.currentTarget)}
            aria-haspopup="menu"
            aria-expanded={Boolean(filterAnchor)}
            sx={{
              width: { sm: 160 },
              minWidth: { sm: 160 },
              flexShrink: 0,
              height: { xs: 40, sm: 32 },
              px: 1.25,
              justifyContent: 'space-between',
              borderColor: brand.neutral[100],
              borderRadius: `${radius.sm}px`,
              bgcolor: 'background.paper',
              color: 'text.secondary',
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              '&:hover': { borderColor: brand.neutral[200], bgcolor: 'background.paper' },
              '& .MuiButton-startIcon': { ml: 0, mr: 0.75 },
              '& .MuiButton-endIcon': { ml: 0.75, mr: 0 },
              '& .MuiSvgIcon-root': { fontSize: 16 },
            }}
          >
            {selectedStage?.label ?? 'Filtrar por Etapa'}
          </Button>
          <Menu
            anchorEl={filterAnchor}
            open={Boolean(filterAnchor)}
            onClose={() => setFilterAnchor(null)}
          >
            <MenuItem
              selected={!selectedStageId}
              onClick={() => {
                setSelectedStageId(null)
                setFilterAnchor(null)
              }}
            >
              Todas as etapas
            </MenuItem>
            {salesPipelineStages.map((stage) => (
              <MenuItem
                key={stage.id}
                selected={selectedStageId === stage.id}
                onClick={() => {
                  setSelectedStageId(stage.id)
                  setFilterAnchor(null)
                }}
              >
                <Box
                  aria-hidden="true"
                  sx={{ width: 8, height: 8, mr: 1.2, borderRadius: '50%', bgcolor: stage.color }}
                />
                {stage.label}
              </MenuItem>
            ))}
          </Menu>
          <Tooltip title="Fluxo de criação em preparação">
            <Box
              component="span"
              tabIndex={0}
              aria-label="Nova Oportunidade: fluxo de criação em preparação"
              sx={{ display: 'inline-flex', width: { sm: 166 }, minWidth: { sm: 166 } }}
            >
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                disabled
                sx={{
                  width: '100%',
                  height: { xs: 40, sm: 32 },
                  px: 1.5,
                  borderRadius: `${radius.sm}px`,
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  '& .MuiButton-startIcon': { ml: 0, mr: 0.75 },
                  '& .MuiSvgIcon-root': { fontSize: 16 },
                  '&.Mui-disabled': {
                    bgcolor: brand.magenta[500],
                    color: surface.lightText,
                    opacity: 1,
                  },
                }}
              >
                Nova Oportunidade
              </Button>
            </Box>
          </Tooltip>
        </Stack>
      </Stack>

      {hasPipelineError ? (
        <Alert
          severity="error"
          sx={{ mt: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                if (opportunitiesQuery.isError) void opportunitiesQuery.refetch()
                if (propertiesQuery.isError) void propertiesQuery.refetch()
              }}
            >
              Tentar novamente
            </Button>
          }
        >
          Não foi possível carregar os dados do pipeline.
        </Alert>
      ) : (
        <Box
          aria-label="Pipeline de oportunidades"
          sx={{
            mt: { xs: 2.25, lg: 1.5 },
            mx: { xs: -2, sm: -3, lg: -3.5 },
            pl: { xs: 2, sm: 3, lg: 3.5 },
            pr: { xs: 2, sm: 3, lg: 1.75 },
            pb: 1,
            overflowX: 'auto',
            scrollSnapType: { xs: 'x proximity', lg: 'none' },
            scrollbarWidth: 'thin',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(5, 264px)',
                sm: 'repeat(5, 280px)',
                lg: 'repeat(5, minmax(0, 1fr))',
              },
              gap: { xs: 2, lg: 1.75 },
              minWidth: { xs: 'max-content', lg: 0 },
            }}
          >
            {salesPipelineStages.map((stage) => {
              const opportunities = visibleOpportunities.filter(
                (opportunity) => getOpportunityStageId(opportunity, fixtureMode) === stage.id,
              )
              const projectedTotals = getProjectedTotals(
                opportunities.filter((opportunity) => opportunity.status !== 'RECUSADA'),
                propertiesById,
              )

              return (
                <Stack
                  key={stage.id}
                  component="section"
                  role="region"
                  aria-labelledby={`sales-pipeline-stage-${stage.id}`}
                  sx={{
                    minWidth: 0,
                    minHeight: { xs: 548, lg: 'calc(100vh - 110px)' },
                    scrollSnapAlign: 'start',
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    sx={{
                      minHeight: 32,
                      pb: 0.75,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box
                      aria-hidden="true"
                      sx={{
                        width: 7,
                        height: 7,
                        mr: 0.75,
                        flexShrink: 0,
                        borderRadius: '50%',
                        bgcolor: stage.color,
                      }}
                    />
                    <Typography
                      id={`sales-pipeline-stage-${stage.id}`}
                      noWrap
                      sx={pipelineStageLabelSx}
                    >
                      {stage.label}
                    </Typography>
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-grid',
                        placeItems: 'center',
                        minWidth: 20,
                        height: 18,
                        ml: 'auto',
                        px: 0.625,
                        borderRadius: `${radius.full}px`,
                        bgcolor: stage.softColor,
                        color: stage.color,
                        fontSize: 10.5,
                        fontWeight: 700,
                      }}
                    >
                      {isPipelineLoading ? '-' : opportunities.length}
                    </Box>
                  </Stack>

                  <Stack spacing={{ xs: 1.5, lg: 1.375 }} sx={{ pt: { xs: 2, lg: 1.75 } }}>
                    {isPipelineLoading
                      ? [0, 1].map((index) => (
                          <Skeleton
                            key={index}
                            variant="rounded"
                            height={124}
                            sx={{ borderRadius: `${radius.md}px` }}
                          />
                        ))
                      : opportunities.map((opportunity) => (
                          <OpportunityCard
                            key={opportunity.id}
                            opportunity={opportunity}
                            property={propertiesById.get(opportunity.imovelId)}
                            density="compact"
                            presentation={
                              fixtureMode
                                ? fixturePresentationByOpportunityId.get(opportunity.id)
                                : undefined
                            }
                          />
                        ))}

                    {!isPipelineLoading && !hasPipelineError && opportunities.length === 0 ? (
                      <Stack
                        alignItems="center"
                        justifyContent="center"
                        sx={{
                          minHeight: 124,
                          px: 1.5,
                          border: '1px dashed',
                          borderColor: brand.neutral[200],
                          borderRadius: `${radius.md}px`,
                          bgcolor: surface.paper,
                          textAlign: 'center',
                        }}
                      >
                        <Typography color="text.secondary" sx={{ fontSize: 11.5 }}>
                          Nenhuma oportunidade nesta etapa.
                        </Typography>
                      </Stack>
                    ) : null}
                  </Stack>

                  <Box
                    role="group"
                    aria-label={`Total projetado de ${stage.label}`}
                    sx={{
                      mt: 'auto',
                      pt: { xs: 1.25, lg: 1.5 },
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      sx={{
                        color: 'text.disabled',
                        fontSize: 9,
                        fontWeight: 700,
                        lineHeight: 1.2,
                        letterSpacing: '0.01em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Total projetado
                    </Typography>
                    {isPipelineLoading ? (
                      <Skeleton width={92} />
                    ) : projectedTotals.length === 0 ? (
                      <Typography sx={{ mt: 0.25, fontSize: 13, fontWeight: 800, lineHeight: 1.3 }}>
                        {formatCurrency(0)}
                      </Typography>
                    ) : (
                      <Stack
                        spacing={0.25}
                        sx={{ mt: 0.25, minHeight: projectedTotals.length > 1 ? 36 : 0 }}
                      >
                        {projectedTotals.map((total) => (
                          <Stack
                            key={total.label}
                            direction="row"
                            alignItems="baseline"
                            justifyContent="space-between"
                            gap={1}
                          >
                            {projectedTotals.length > 1 ? (
                              <Typography
                                sx={{ color: 'text.secondary', fontSize: 9.5, lineHeight: 1.2 }}
                              >
                                {total.label}
                              </Typography>
                            ) : null}
                            <Typography sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.3 }}>
                              {total.value}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Stack>
              )
            })}
          </Box>
        </Box>
      )}
    </Box>
  )
}
