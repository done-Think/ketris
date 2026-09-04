'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Avatar, Box, Button, Chip, InputAdornment, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import {
  alpha,
  brand,
  iconSize,
  motion,
  radius,
  shadows,
  supportColor,
  surface,
} from '@shared/theme/tokens'

import { useLeadsStore } from '../stores/leads-store'
import type {
  DashboardLead,
  LeadFilterKey,
  LeadStageLabelKey,
  LeadsDashboardFiltersFormValues,
  LeadStage,
  LeadStageStyle,
  LeadStatusFilterOption,
  LeadStatusChipProps,
} from '../types/lead'
import { CreateLeadDialog } from './CreateLeadDialog'
import { LeadContactDialog } from './LeadContactDialog'

const leadStatusFilters: LeadStatusFilterOption[] = [
  { labelKey: 'all', label: 'Todos' },
  { labelKey: 'new', label: 'Novo' },
  { labelKey: 'contacted', label: 'Em contato' },
  { labelKey: 'visitScheduled', label: 'Visita marcada' },
  { labelKey: 'proposal', label: 'Proposta' },
]

const leadStageLabelKeys: Record<LeadStage, LeadStageLabelKey> = {
  Novo: 'new',
  'Em contato': 'contacted',
  'Visita marcada': 'visitScheduled',
  Proposta: 'proposal',
}

const leadStageStyles: Record<LeadStage, LeadStageStyle> = {
  Novo: { bgcolor: alpha.magenta[10], color: brand.magenta[700] },
  'Em contato': { bgcolor: supportColor.infoSoft, color: brand.semantic.info },
  'Visita marcada': { bgcolor: supportColor.warningSoft, color: brand.semantic.warning },
  Proposta: { bgcolor: supportColor.successSoft, color: brand.semantic.success },
}

function getFilterCount(leads: DashboardLead[], filter: LeadFilterKey) {
  if (filter === 'Todos') return leads.length

  return leads.filter((lead) => lead.stage === filter).length
}

function getLeadInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('pt-BR')
}

function filterLeads(leads: DashboardLead[], searchQuery: string, activeFilter: LeadFilterKey) {
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase('pt-BR')

  return leads.filter((lead) => {
    const matchesFilter = activeFilter === 'Todos' || lead.stage === activeFilter
    const matchesSearch =
      !normalizedSearch ||
      [lead.name, lead.interest, lead.source, lead.broker].some((value) =>
        value.toLocaleLowerCase('pt-BR').includes(normalizedSearch),
      )

    return matchesFilter && matchesSearch
  })
}

function LeadStatusChip({ stage }: LeadStatusChipProps) {
  const t = useTranslations('crm.leads')
  const status = leadStageStyles[stage]

  return (
    <Chip
      label={t(`filters.${leadStageLabelKeys[stage]}`)}
      size="small"
      sx={{
        width: 'fit-content',
        bgcolor: status.bgcolor,
        color: status.color,
        borderRadius: `${radius.full}px`,
        fontSize: 11,
        fontWeight: 900,
      }}
    />
  )
}

const leadTableColumnKeys = [
  'name',
  'interest',
  'budget',
  'status',
  'source',
  'lastContact',
  'actions',
] as const

export function LeadsDashboardPage() {
  const t = useTranslations('crm.leads')
  const leads = useLeadsStore((state) => state.leads)
  const [isCreateLeadDialogOpen, setIsCreateLeadDialogOpen] = useState(false)
  const [selectedContactLead, setSelectedContactLead] = useState<DashboardLead | null>(null)
  const { control, setValue } = useForm<LeadsDashboardFiltersFormValues>({
    defaultValues: {
      activeFilter: 'Todos',
      searchQuery: '',
    },
  })
  const activeFilter = useWatch({ control, name: 'activeFilter' })
  const searchQuery = useWatch({ control, name: 'searchQuery' })
  const filteredLeads = useMemo(
    () => filterLeads(leads, searchQuery, activeFilter),
    [activeFilter, leads, searchQuery],
  )

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
      <Stack spacing={2.2}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          alignItems={{ xs: 'stretch', lg: 'flex-start' }}
          justifyContent="space-between"
          spacing={1.6}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h3"
              sx={{ color: brand.graphite[500], fontSize: { xs: 30, md: 40 }, fontWeight: 900 }}
            >
              {t('title')}
            </Typography>
            <Typography sx={{ color: brand.neutral[500], fontSize: { xs: 14, md: 15 } }}>
              {t('subtitle')}
            </Typography>
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.2}
            sx={{ width: { xs: '100%', lg: 'auto' } }}
          >
            <RhfTextField
              control={control}
              name="searchQuery"
              placeholder={t('searchPlaceholder')}
              size="small"
              sx={{
                width: { xs: '100%', sm: 320 },
                '& .MuiOutlinedInput-root': {
                  bgcolor: surface.paper,
                  borderRadius: `${radius.sm}px`,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: brand.neutral[400], fontSize: iconSize.md }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="button"
              variant="contained"
              startIcon={<AddRoundedIcon sx={{ fontSize: iconSize.sm }} />}
              onClick={() => setIsCreateLeadDialogOpen(true)}
              sx={{ minHeight: 40, borderRadius: `${radius.sm}px`, fontWeight: 900 }}
            >
              {t('newLead')}
            </Button>
          </Stack>
        </Stack>

        <Stack
          direction="row"
          sx={{
            flexWrap: 'wrap',
            gap: 1,
            justifyContent: { xs: 'center', md: 'flex-start' },
          }}
        >
          {leadStatusFilters.map((filter) => {
            const active = activeFilter === filter.label

            return (
              <Button
                key={filter.label}
                type="button"
                variant={active ? 'contained' : 'outlined'}
                onClick={() => setValue('activeFilter', filter.label)}
                sx={{
                  minHeight: 34,
                  borderRadius: `${radius.full}px`,
                  px: 1.8,
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                {t(`filters.${filter.labelKey}`)} {getFilterCount(leads, filter.label)}
              </Button>
            )
          })}
        </Stack>

        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            bgcolor: surface.paper,
            border: '1px solid',
            borderColor: alpha.graphite[6],
            borderRadius: `${radius.sm}px`,
            boxShadow: shadows.crmDetailPanel,
            overflowX: 'auto',
          }}
        >
          <Box sx={{ minWidth: 840 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1.55fr 1.55fr 0.85fr 0.95fr 0.9fr 1fr 0.8fr',
                columnGap: 1.8,
                px: 2.4,
                py: 1.8,
              }}
            >
              {leadTableColumnKeys.map((columnKey) => (
                <Typography
                  key={columnKey}
                  sx={{
                    color: brand.neutral[500],
                    fontSize: 11,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                  }}
                >
                  {t(`tableColumns.${columnKey}`)}
                </Typography>
              ))}
            </Box>

            {filteredLeads.map((lead) => (
              <Box
                key={lead.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1.55fr 1.55fr 0.85fr 0.95fr 0.9fr 1fr 0.8fr',
                  columnGap: 1.8,
                  alignItems: 'center',
                  minHeight: 64,
                  px: 2.4,
                  borderTop: '1px solid',
                  borderColor: alpha.graphite[6],
                  transition: motion.transition.interactive,
                  '&:hover': { bgcolor: brand.neutral[50] },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 0 }}>
                  <Avatar
                    sx={{
                      width: 34,
                      height: 34,
                      bgcolor: alpha.magenta[10],
                      color: brand.magenta[700],
                      fontSize: 11,
                      fontWeight: 900,
                    }}
                  >
                    {getLeadInitials(lead.name)}
                  </Avatar>
                  <Typography
                    noWrap
                    sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 900 }}
                  >
                    {lead.name}
                  </Typography>
                </Stack>
                <Typography
                  noWrap
                  sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}
                >
                  {lead.interest}
                </Typography>
                <Typography sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 900 }}>
                  {lead.budget}
                </Typography>
                <LeadStatusChip stage={lead.stage} />
                <Typography
                  noWrap
                  sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}
                >
                  {lead.source}
                </Typography>
                <Typography
                  noWrap
                  sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}
                >
                  {lead.lastContact}
                </Typography>
                <Button
                  type="button"
                  size="small"
                  onClick={() => setSelectedContactLead(lead)}
                  sx={{
                    justifySelf: 'start',
                    minWidth: 0,
                    px: 0.6,
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {t('contactAction')}
                </Button>
              </Box>
            ))}
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ borderTop: '1px solid', borderColor: alpha.graphite[6], px: 2.4, py: 1.6 }}
          >
            <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
              {t('resultsCount', { count: filteredLeads.length, total: leads.length })}
            </Typography>
            <Stack direction="row" spacing={0.6}>
              {[1, 2, 3].map((page) => (
                <Button
                  key={page}
                  variant={page === 1 ? 'contained' : 'outlined'}
                  sx={{ minWidth: 30, width: 30, height: 30, borderRadius: `${radius.sm}px`, p: 0 }}
                >
                  {page}
                </Button>
              ))}
            </Stack>
          </Stack>
        </Box>

        <Stack spacing={1.2} sx={{ display: { xs: 'flex', md: 'none' } }}>
          {filteredLeads.map((lead) => (
            <Box
              key={lead.id}
              sx={{
                bgcolor: surface.paper,
                border: '1px solid',
                borderColor: alpha.graphite[6],
                borderRadius: `${radius.sm}px`,
                boxShadow: shadows.crmCard,
                p: 1.6,
              }}
            >
              <Stack spacing={1.4}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1.2}
                >
                  <Stack direction="row" alignItems="center" spacing={1.1} sx={{ minWidth: 0 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: alpha.magenta[10],
                        color: brand.magenta[700],
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      {getLeadInitials(lead.name)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        noWrap
                        sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 900 }}
                      >
                        {lead.name}
                      </Typography>
                      <Typography
                        noWrap
                        sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}
                      >
                        {lead.source}
                      </Typography>
                    </Box>
                  </Stack>
                  <LeadStatusChip stage={lead.stage} />
                </Stack>

                <Box>
                  <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
                    {t('tableColumns.interest')}
                  </Typography>
                  <Typography sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 800 }}>
                    {lead.interest}
                  </Typography>
                </Box>

                <Stack direction="row" justifyContent="space-between" spacing={1.2}>
                  <Box>
                    <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
                      {t('tableColumns.budget')}
                    </Typography>
                    <Typography sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 900 }}>
                      {lead.budget}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
                      {t('tableColumns.lastContact')}
                    </Typography>
                    <Typography sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 800 }}>
                      {lead.lastContact}
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  type="button"
                  variant="outlined"
                  fullWidth
                  onClick={() => setSelectedContactLead(lead)}
                  sx={{ borderRadius: `${radius.sm}px`, fontWeight: 900 }}
                >
                  {t('contactAction')}
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Stack>
      <CreateLeadDialog
        open={isCreateLeadDialogOpen}
        onClose={() => setIsCreateLeadDialogOpen(false)}
      />
      <LeadContactDialog
        lead={selectedContactLead}
        open={Boolean(selectedContactLead)}
        onClose={() => setSelectedContactLead(null)}
      />
    </Box>
  )
}
