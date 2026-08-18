import { Box, Chip, IconButton, Stack, Typography } from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'

import {
  alpha,
  brand,
  componentText,
  iconSize,
  motion,
  radius,
  shadows,
  surface,
} from '@shared/theme/tokens'

import {
  dashboardPropertyColumns,
  dashboardPropertyStatusStyles,
  dashboardPropertyTableGridColumns,
} from '../config/dashboard-property-ui'
import type { PropertiesTableProps } from '../types/dashboard-property'

export function PropertiesTable({
  properties,
  totalCount,
  onPropertySelect,
}: PropertiesTableProps) {
  return (
    <Box
      sx={{
        bgcolor: surface.paper,
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.propertyCard,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: alpha.graphite[6],
        width: '100%',
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'grid' },
          gridTemplateColumns: dashboardPropertyTableGridColumns,
          px: 3.5,
          py: 1.85,
          bgcolor: brand.neutral[50],
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {dashboardPropertyColumns.map((column) => (
          <Typography
            key={column}
            sx={{ color: brand.neutral[500], ...componentText.dashboardTableHeader }}
          >
            {column}
          </Typography>
        ))}
      </Box>

      {properties.map((property) => {
        const status = dashboardPropertyStatusStyles[property.status]

        return (
          <Box
            key={property.id}
            role="button"
            tabIndex={0}
            onClick={() => onPropertySelect(property.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onPropertySelect(property.id)
              }
            }}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '54px 1fr auto', md: dashboardPropertyTableGridColumns },
              alignItems: 'center',
              gap: { xs: 1.2, md: 0 },
              px: { xs: 1.5, md: 3.5 },
              py: { xs: 1.6, md: 2.25 },
              borderBottom: '1px solid',
              borderColor: 'divider',
              cursor: 'pointer',
              transition: motion.transition.interactive,
              '&:hover': { bgcolor: brand.neutral[50] },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 0 }}>
              <Box
                component="img"
                src={property.imageUrl}
                alt=""
                sx={{
                  width: { xs: 56, md: 76 },
                  height: { xs: 56, md: 76 },
                  borderRadius: `${radius.sm}px`,
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ ...componentText.dashboardHeroSubtitle }}>
                  {property.title}
                </Typography>
                <Typography
                  noWrap
                  sx={{ color: 'text.secondary', ...componentText.dashboardHeroMeta }}
                >
                  {property.address}
                </Typography>
              </Box>
            </Stack>

            <Typography
              sx={{ display: { xs: 'none', md: 'block' }, ...componentText.dashboardCell }}
            >
              {property.type}
            </Typography>
            <Typography sx={{ ...componentText.dashboardHeroSubtitle }}>
              {property.price}
            </Typography>
            <Chip
              label={property.status}
              size="small"
              sx={{
                justifySelf: { xs: 'end', md: 'start' },
                height: 30,
                borderRadius: `${radius.full}px`,
                bgcolor: status.bgcolor,
                color: status.color,
                ...componentText.dashboardBadge,
              }}
            />
            <Typography
              sx={{
                display: { xs: 'none', md: 'block' },
                color: 'text.secondary',
                ...componentText.dashboardCell,
              }}
            >
              {property.broker}
            </Typography>
            <Typography
              sx={{
                display: { xs: 'none', md: 'block' },
                color: 'text.secondary',
                ...componentText.dashboardCell,
              }}
            >
              {property.updatedAt}
            </Typography>
            <Stack
              direction="row"
              spacing={0.8}
              sx={{ display: { xs: 'none', md: 'flex' }, justifySelf: 'end' }}
            >
              <IconButton
                aria-label={`Editar ${property.title}`}
                onClick={(event) => {
                  event.stopPropagation()
                }}
                sx={{
                  width: 40,
                  height: 40,
                  border: '1px solid',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    bgcolor: alpha.magenta[6],
                  },
                }}
              >
                <EditOutlinedIcon sx={{ fontSize: iconSize.lg }} />
              </IconButton>
              <IconButton
                aria-label={`Visualizar ${property.title}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onPropertySelect(property.id)
                }}
                sx={{
                  width: 40,
                  height: 40,
                  border: '1px solid',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    bgcolor: alpha.magenta[6],
                  },
                }}
              >
                <VisibilityOutlinedIcon sx={{ fontSize: iconSize.lg }} />
              </IconButton>
            </Stack>
          </Box>
        )
      })}

      {!properties.length ? (
        <Box sx={{ px: 3.5, py: 5, textAlign: 'center' }}>
          <Typography sx={{ ...componentText.dashboardGroupTitle, mb: 0.6 }}>
            Nenhum imóvel encontrado
          </Typography>
          <Typography sx={{ color: 'text.secondary', ...componentText.dashboardBodyText }}>
            Ajuste a busca ou selecione outro filtro.
          </Typography>
        </Box>
      ) : null}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ px: 3.5, py: 2.6 }}
      >
        <Typography sx={{ color: 'text.secondary', ...componentText.dashboardCell }}>
          Mostrando {properties.length} de {totalCount} imóveis
        </Typography>
        <Stack direction="row" spacing={0.7} justifyContent="flex-end">
          {[1, 2, 3].map((page) => (
            <IconButton
              key={page}
              aria-label={`Página ${page}`}
              sx={{
                width: 38,
                height: 38,
                bgcolor: page === 1 ? 'primary.main' : surface.paper,
                border: '1px solid',
                borderColor: page === 1 ? 'primary.main' : 'divider',
                color: page === 1 ? surface.lightText : 'text.secondary',
                ...componentText.dashboardChipLabel,
                '&:hover': {
                  bgcolor: page === 1 ? 'primary.dark' : alpha.graphite[6],
                },
              }}
            >
              {page}
            </IconButton>
          ))}
          <IconButton
            aria-label="Mais páginas"
            sx={{ width: 38, height: 38, border: '1px solid', borderColor: 'divider' }}
          >
            <MoreHorizRoundedIcon sx={{ fontSize: iconSize.sm }} />
          </IconButton>
          <IconButton
            aria-label="Página 8"
            sx={{
              width: 38,
              height: 38,
              border: '1px solid',
              borderColor: 'divider',
              ...componentText.dashboardChipLabel,
            }}
          >
            8
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  )
}
