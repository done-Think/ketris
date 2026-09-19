import { Box, Button, MenuItem, Stack, TextField } from '@mui/material'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { proposalStatusFilters } from '../../config/proposal-statuses'
import type { ProposalStatusFiltersProps } from '../../types/proposal-management'

export function ProposalStatusFilters({
  activeStatus,
  summary,
  onStatusChange,
}: ProposalStatusFiltersProps) {
  const activeOption =
    proposalStatusFilters.find((filter) => filter.id === activeStatus) ?? proposalStatusFilters[0]
  const activeCount =
    activeStatus === 'all' ? summary.totalCount : summary.statusCounts[activeStatus]

  return (
    <>
      <TextField
        select
        size="small"
        value={activeStatus}
        onChange={(event) => onStatusChange(event.target.value as typeof activeStatus)}
        sx={{
          display: { xs: 'block', sm: 'none' },
          width: '100%',
          mt: 2,
          '& .MuiOutlinedInput-root': {
            minHeight: 46,
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.paper,
            color: brand.graphite[500],
            fontSize: 14,
            fontWeight: 800,
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'transparent',
              borderWidth: 0,
            },
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'transparent',
            borderWidth: 0,
          },
          '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'transparent',
          },
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
          },
        }}
        SelectProps={{
          inputProps: { 'aria-label': 'Filtrar propostas por status' },
          renderValue: () => (
            <FilterOptionLabel label={activeOption.label} count={activeCount} active />
          ),
          MenuProps: {
            PaperProps: {
              sx: {
                mt: 0.6,
                borderRadius: `${radius.sm}px`,
                boxShadow: shadows.popover,
              },
            },
          },
        }}
      >
        {proposalStatusFilters.map(({ id, label }) => {
          const active = id === activeStatus
          const count = id === 'all' ? summary.totalCount : summary.statusCounts[id]

          return (
            <MenuItem
              key={id}
              value={id}
              sx={{
                minHeight: 42,
                bgcolor: active ? alpha.magenta[8] : 'transparent',
                '&:hover': {
                  bgcolor: alpha.magenta[8],
                },
              }}
            >
              <FilterOptionLabel label={label} count={count} active={active} />
            </MenuItem>
          )
        })}
      </TextField>

      <Stack
        component="div"
        role="group"
        aria-label="Filtrar propostas por status"
        direction="row"
        spacing={0.75}
        sx={{
          display: { xs: 'none', sm: 'flex' },
          mt: 2,
          overflowX: 'auto',
          pb: 0.25,
          scrollbarWidth: 'thin',
        }}
      >
        {proposalStatusFilters.map(({ id, label }) => {
          const active = id === activeStatus
          const count = id === 'all' ? summary.totalCount : summary.statusCounts[id]

          return (
            <Button
              key={id}
              type="button"
              variant="text"
              aria-pressed={active}
              onClick={() => onStatusChange(id)}
              sx={{
                minWidth: 0,
                height: 30,
                px: 1.4,
                flexShrink: 0,
                gap: 0.75,
                borderRadius: `${radius.full}px`,
                bgcolor: active ? brand.magenta[500] : brand.neutral[50],
                color: active ? surface.lightText : brand.graphite[500],
                fontSize: 11.5,
                fontWeight: active ? 700 : 500,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                '&:hover': {
                  bgcolor: active ? brand.magenta[600] : brand.neutral[100],
                },
              }}
            >
              {label}
              <Box
                component="span"
                sx={{
                  display: 'grid',
                  minWidth: 18,
                  height: 18,
                  placeItems: 'center',
                  px: 0.5,
                  borderRadius: `${radius.full}px`,
                  bgcolor: active ? alpha.white[8] : alpha.graphite[6],
                  color: active ? surface.lightText : brand.neutral[500],
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {count}
              </Box>
            </Button>
          )
        })}
      </Stack>
    </>
  )
}

function FilterOptionLabel({
  active,
  count,
  label,
}: {
  active: boolean
  count: number
  label: string
}) {
  return (
    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
      <Box component="span">{label}</Box>
      <Box
        component="span"
        sx={{
          display: 'grid',
          minWidth: 22,
          height: 22,
          placeItems: 'center',
          px: 0.6,
          borderRadius: `${radius.full}px`,
          bgcolor: active ? brand.magenta[500] : alpha.graphite[6],
          color: active ? surface.lightText : brand.neutral[500],
          fontSize: 11,
          fontWeight: 900,
        }}
      >
        {count}
      </Box>
    </Box>
  )
}
