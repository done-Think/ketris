'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { Box, Button, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import { useSnackbar } from 'notistack'

import { brand, componentText, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import type { OwnerPropertyCardProps } from '../types/owner-property'

const actionSx = {
  ...componentText.cardAction,
  fontSize: { xs: 11, md: componentText.cardAction.fontSize },
  minWidth: { xs: 44, md: 0 },
  whiteSpace: 'nowrap',
  px: { xs: 0.5, md: 1.5 },
  minHeight: { xs: 44, md: 32 },
  borderRadius: `${radius.sm}px`,
} as const

export function OwnerPropertyCard({ property }: OwnerPropertyCardProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const { enqueueSnackbar } = useSnackbar()
  const detailHref = `/dashboard/imoveis/${property.id}`
  const titleId = `property-${property.id}-title`
  const menuId = `property-${property.id}-menu`

  return (
    <Box
      component="article"
      aria-labelledby={titleId}
      sx={{
        minWidth: 0,
        bgcolor: surface.paper,
        borderRadius: `${radius.lg}px`,
        boxShadow: shadows.crmCard,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          height: { md: 220 },
          aspectRatio: { xs: '2.2', md: 'auto' },
          p: { xs: 2, md: 3 },
          background: `linear-gradient(35deg, ${brand.magenta[500]} 30%, ${brand.graphite[500]} 65%)`,
        }}
      >
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            px: { xs: 0.5, md: 1.5 },
            py: { xs: 0.25, md: 0.75 },
            borderRadius: `${radius.sm}px`,
            bgcolor: { xs: 'transparent', md: brand.magenta[50] },
            color: { xs: brand.semantic.success, md: brand.magenta[600] },
            fontSize: { xs: 10, md: 12 },
            lineHeight: 1.2,
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
            {property.badgeStatus === 'active' ? 'Ativo' : 'Pausado'}
          </Box>
          <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
            {property.status === 'active' ? 'Ativo' : 'Pausado'}
          </Box>
        </Box>
      </Box>
      <Box sx={{ p: { xs: 1.5, md: 3 }, pb: { xs: 0, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Typography
            id={titleId}
            component="h2"
            sx={{
              ...componentText.cardTitle,
              fontSize: { xs: 14, md: componentText.cardTitle.fontSize },
              fontWeight: 700,
              minWidth: 0,
            }}
          >
            {property.title}
          </Typography>
          <Box
            component="span"
            sx={{
              flexShrink: 0,
              display: { xs: 'none', md: 'block' },
              bgcolor: brand.magenta[50],
              color: brand.magenta[500],
              px: 1,
              py: 0.25,
              borderRadius: `${radius.sm}px`,
              fontSize: 10,
            }}
          >
            {property.purpose === 'rent' ? 'Aluguel' : 'Venda'}
          </Box>
        </Stack>
        <Typography
          sx={{
            display: { xs: 'none', md: 'block' },
            mt: 0.75,
            color: brand.neutral[500],
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {property.address}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 1,
            mt: 0.5,
          }}
        >
          <Typography
            sx={{
              ...componentText.cardPrice,
              fontSize: { xs: 12, md: componentText.cardPrice.fontSize },
              color: 'primary.main',
              fontWeight: 700,
            }}
          >
            <Box component="span">{property.price}</Box>
            <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
              {' '}
              · {property.purpose === 'rent' ? 'Aluguel' : 'Venda'}
            </Box>
          </Typography>
          <Typography
            sx={{
              display: { xs: 'block', md: 'none' },
              color: brand.neutral[400],
              fontSize: 10,
              whiteSpace: 'nowrap',
            }}
          >
            Há {property.publishedDaysAgo} dias
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexWrap: { xs: 'nowrap', md: 'wrap' },
            justifyContent: 'space-between',
            gap: { xs: 0.5, md: 1 },
            mt: { xs: 1, md: 2 },
            px: { xs: 0, md: 1.25 },
            py: 1,
            bgcolor: { xs: 'transparent', md: surface.app },
            border: { xs: 0, md: '1px solid' },
            borderColor: 'divider',
            borderRadius: `${radius.sm}px`,
          }}
        >
          {[
            {
              label: 'visualizações',
              mobileLabel: 'views',
              value: property.views,
              Icon: VisibilityOutlinedIcon,
            },
            {
              label: 'favoritos',
              mobileLabel: 'favs',
              value: property.favorites,
              Icon: FavoriteBorderOutlinedIcon,
            },
            {
              label: 'propostas',
              mobileLabel: 'propostas',
              value: property.proposals,
              Icon: DescriptionOutlinedIcon,
            },
          ].map(({ label, mobileLabel, value, Icon }) => (
            <Stack
              key={label}
              direction="row"
              alignItems="center"
              spacing={{ xs: 0.5, md: 0.75 }}
              sx={{ color: brand.neutral[600] }}
            >
              <Icon sx={{ fontSize: { xs: 12, md: iconSize.xs } }} />
              <Typography
                sx={{
                  ...componentText.cardMeta,
                  fontSize: { xs: 10, md: componentText.cardMeta.fontSize },
                  whiteSpace: 'nowrap',
                }}
              >
                <Box component="span" sx={{ fontWeight: 700 }}>
                  {value}
                </Box>{' '}
                <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                  {label}
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
                  {mobileLabel}
                </Box>
              </Typography>
            </Stack>
          ))}
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: { xs: 1, md: 1.5 },
            mt: { xs: 0, md: 2.5 },
            pt: { xs: 0, md: 2.5 },
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Button
            component={NextLink}
            href={detailHref}
            variant="outlined"
            color="secondary"
            aria-label="Editar Anúncio"
            sx={{ ...actionSx, borderColor: 'divider', borderWidth: { xs: 0, md: 1 } }}
          >
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
              Editar Anúncio
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
              Editar
            </Box>
          </Button>
          <Button
            color="secondary"
            onClick={() =>
              enqueueSnackbar('A opção de pausar anúncios ainda não está disponível.', {
                variant: 'info',
              })
            }
            sx={actionSx}
          >
            Pausar
          </Button>
          <Button
            component={NextLink}
            href="/dashboard/propostas"
            sx={{ ...actionSx, ml: 'auto', px: 0.5 }}
          >
            Ver Propostas
          </Button>
          <IconButton
            aria-label={`Mais ações para ${property.title}`}
            aria-controls={menuAnchor ? menuId : undefined}
            aria-haspopup="menu"
            aria-expanded={menuAnchor ? true : undefined}
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            sx={{ display: { xs: 'none', md: 'inline-flex' }, color: brand.neutral[500], p: 0.5 }}
          >
            <MoreHorizRoundedIcon sx={{ fontSize: iconSize.lg }} />
          </IconButton>
        </Box>
      </Box>
      <Menu
        id={menuId}
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem component={NextLink} href={detailHref} onClick={() => setMenuAnchor(null)}>
          Ver detalhes
        </MenuItem>
      </Menu>
    </Box>
  )
}
