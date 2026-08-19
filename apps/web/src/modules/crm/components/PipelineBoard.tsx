'use client'

import { useEffect, useMemo, useState } from 'react'
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
  Typography,
} from '@mui/material'
import { useSession } from 'next-auth/react'

import { brand, radius, surface } from '@shared/theme/tokens'

import { opportunityStages } from '../config/opportunity-stages'
import { useCrmProperties, useOpportunities } from '../hooks/use-opportunities'
import type { Opportunity, OpportunityStatus } from '../types/opportunity'
import type { PipelineBoardProps } from '../types/pipeline-board'
import { formatCurrency, formatMonthlyCurrency } from '../utils/formatters'
import { OpportunityCard } from './OpportunityCard'

const validStatuses = new Set<OpportunityStatus>(opportunityStages.map((stage) => stage.status))

function matchesSearch(opportunity: Opportunity, propertyTitle: string, search: string): boolean {
  if (!search) return true

  return [
    opportunity.interessadoNome,
    opportunity.interessadoEmail,
    opportunity.interessadoTelefone,
    propertyTitle,
  ].some((value) => value?.toLocaleLowerCase('pt-BR').includes(search))
}

export function PipelineBoard({ initialStatus = null }: PipelineBoardProps) {
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<OpportunityStatus | null>(
    initialStatus && validStatuses.has(initialStatus) ? initialStatus : null,
  )
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null)

  const opportunitiesQuery = useOpportunities(tenantId)
  const propertiesQuery = useCrmProperties(tenantId)

  useEffect(() => {
    setSelectedStatus(initialStatus && validStatuses.has(initialStatus) ? initialStatus : null)
  }, [initialStatus])

  const propertiesById = useMemo(
    () => new Map((propertiesQuery.data ?? []).map((property) => [property.id, property])),
    [propertiesQuery.data],
  )

  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')
  const visibleOpportunities = useMemo(
    () =>
      (opportunitiesQuery.data ?? []).filter((opportunity) => {
        if (selectedStatus && opportunity.status !== selectedStatus) return false

        const propertyTitle =
          propertiesById.get(opportunity.imovelId)?.titulo ?? opportunity.imovelId
        return matchesSearch(opportunity, propertyTitle, normalizedSearch)
      }),
    [normalizedSearch, opportunitiesQuery.data, propertiesById, selectedStatus],
  )

  const filterLabel = selectedStatus
    ? opportunityStages.find((stage) => stage.status === selectedStatus)?.label
    : 'Filtrar por etapa'

  return (
    <Box
      sx={{
        minHeight: '100vh',
        p: { xs: 2, sm: 3, lg: 4 },
        bgcolor: surface.app,
        overflow: 'hidden',
      }}
    >
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        alignItems={{ xs: 'stretch', lg: 'center' }}
        justifyContent="space-between"
        gap={2}
        sx={{ pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Typography
          component="h1"
          sx={{
            flexShrink: 0,
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: { xs: 26, sm: 30, xl: 32 },
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: 0,
          }}
        >
          Pipeline de Vendas
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} sx={{ minWidth: 0 }}>
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar oportunidade..."
            size="small"
            inputProps={{ 'aria-label': 'Buscar oportunidade' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: 'text.disabled', fontSize: 19 }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: '100%', sm: 240 }, bgcolor: 'background.paper' }}
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
              minWidth: { sm: 178 },
              height: 40,
              justifyContent: 'space-between',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              whiteSpace: 'nowrap',
            }}
          >
            {filterLabel}
          </Button>
          <Menu
            anchorEl={filterAnchor}
            open={Boolean(filterAnchor)}
            onClose={() => setFilterAnchor(null)}
          >
            <MenuItem
              selected={!selectedStatus}
              onClick={() => {
                setSelectedStatus(null)
                setFilterAnchor(null)
              }}
            >
              Todas as etapas
            </MenuItem>
            {opportunityStages.map((stage) => (
              <MenuItem
                key={stage.status}
                selected={selectedStatus === stage.status}
                onClick={() => {
                  setSelectedStatus(stage.status)
                  setFilterAnchor(null)
                }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    width: 8,
                    height: 8,
                    mr: 1.2,
                    borderRadius: `${radius.full}px`,
                    bgcolor: stage.color,
                  }}
                />
                {stage.label}
              </MenuItem>
            ))}
          </Menu>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            disabled
            sx={{ minWidth: { sm: 188 }, height: 40, whiteSpace: 'nowrap' }}
          >
            Nova Oportunidade
          </Button>
        </Stack>
      </Stack>

      {opportunitiesQuery.isError ? (
        <Alert
          severity="error"
          sx={{ mt: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => opportunitiesQuery.refetch()}>
              Tentar novamente
            </Button>
          }
        >
          Não foi possível carregar as oportunidades.
        </Alert>
      ) : null}

      <Box
        aria-label="Pipeline de oportunidades"
        sx={{
          mt: 2,
          mx: { xs: -2, sm: -3, lg: -4 },
          px: { xs: 2, sm: 3, lg: 4 },
          pb: 1.5,
          overflowX: 'auto',
          scrollSnapType: { xs: 'x proximity', lg: 'none' },
          scrollbarWidth: 'thin',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(5, minmax(260px, 1fr))',
              sm: 'repeat(5, minmax(280px, 1fr))',
              lg: 'repeat(5, minmax(210px, 1fr))',
            },
            gap: 2,
            minWidth: 'max-content',
          }}
        >
          {opportunityStages.map((stage) => {
            const opportunities = visibleOpportunities.filter(
              (opportunity) => opportunity.status === stage.status,
            )
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
            const projectedTotals = [
              ...(totals.rental
                ? [{ label: 'Aluguel', value: formatMonthlyCurrency(totals.rental) }]
                : []),
              ...(totals.sale ? [{ label: 'Venda', value: formatCurrency(totals.sale) }] : []),
              ...(totals.unclassified
                ? [{ label: 'Sem categoria', value: formatCurrency(totals.unclassified) }]
                : []),
            ]

            return (
              <Stack
                key={stage.status}
                component="section"
                aria-labelledby={`pipeline-stage-${stage.status}`}
                sx={{
                  minWidth: 0,
                  minHeight: { xs: 560, lg: 'calc(100vh - 164px)' },
                  scrollSnapAlign: 'start',
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  sx={{ minHeight: 34, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}
                >
                  <Box
                    aria-hidden="true"
                    sx={{
                      width: 8,
                      height: 8,
                      mr: 1,
                      flexShrink: 0,
                      borderRadius: `${radius.full}px`,
                      bgcolor: stage.color,
                    }}
                  />
                  <Typography
                    id={`pipeline-stage-${stage.status}`}
                    noWrap
                    sx={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase' }}
                  >
                    {stage.label}
                  </Typography>
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-grid',
                      placeItems: 'center',
                      minWidth: 24,
                      height: 20,
                      ml: 'auto',
                      px: 0.75,
                      borderRadius: `${radius.full}px`,
                      bgcolor: stage.softColor,
                      color: stage.color,
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {opportunitiesQuery.isLoading ? '-' : opportunities.length}
                  </Box>
                </Stack>

                <Stack spacing={1.5} sx={{ pt: 2 }}>
                  {opportunitiesQuery.isLoading
                    ? [0, 1].map((index) => (
                        <Skeleton
                          key={index}
                          variant="rounded"
                          height={140}
                          sx={{ borderRadius: 1.5 }}
                        />
                      ))
                    : opportunities.map((opportunity) => (
                        <OpportunityCard
                          key={opportunity.id}
                          opportunity={opportunity}
                          property={propertiesById.get(opportunity.imovelId)}
                        />
                      ))}

                  {!opportunitiesQuery.isLoading &&
                  !opportunitiesQuery.isError &&
                  opportunities.length === 0 ? (
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      sx={{
                        minHeight: 92,
                        px: 2,
                        border: '1px dashed',
                        borderColor: brand.neutral[200],
                        borderRadius: 1.5,
                        bgcolor: surface.paper,
                        textAlign: 'center',
                      }}
                    >
                      <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                        Nenhuma oportunidade nesta etapa.
                      </Typography>
                    </Stack>
                  ) : null}
                </Stack>

                <Box
                  role="group"
                  aria-label={`Total projetado de ${stage.label}`}
                  sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
                >
                  <Typography
                    sx={{
                      color: 'text.disabled',
                      fontSize: 9.5,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    Total projetado
                  </Typography>
                  {opportunitiesQuery.isLoading ? (
                    <Skeleton width={92} />
                  ) : projectedTotals.length === 0 ? (
                    <Typography sx={{ mt: 0.25, fontSize: 13, fontWeight: 800 }}>
                      {formatCurrency(0)}
                    </Typography>
                  ) : (
                    <Stack spacing={0.25} sx={{ mt: 0.25, minHeight: 38 }}>
                      {projectedTotals.map((total) => (
                        <Stack
                          key={total.label}
                          direction="row"
                          alignItems="baseline"
                          justifyContent="space-between"
                          gap={1}
                        >
                          {projectedTotals.length > 1 ? (
                            <Typography sx={{ color: 'text.secondary', fontSize: 9.5 }}>
                              {total.label}
                            </Typography>
                          ) : null}
                          <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
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
    </Box>
  )
}
