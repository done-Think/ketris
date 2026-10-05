'use client'

import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import { Avatar, Box, Button, Chip, Paper, Stack, Typography, useMediaQuery } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import { brand, iconSize, radius, surface } from '@shared/theme/tokens'

import type { OpportunityActivitiesPanelProps } from '../../types/opportunity-detail'
import { formatRelativeDate } from '../../utils/formatters'
import { panelSx } from './opportunity-detail.styles'

export function OpportunityActivitiesPanel({ activities }: OpportunityActivitiesPanelProps) {
  const t = useTranslations('crm.opportunityDetail')
  const panelRef = useRef<HTMLElement | null>(null)
  const listViewportRef = useRef<HTMLDivElement | null>(null)
  const listContentRef = useRef<HTMLDivElement | null>(null)
  const isMobile = useMediaQuery('(max-width:899px)')
  const [expanded, setExpanded] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)
  const canExpand = expanded || hasOverflow

  useEffect(() => {
    function updateOverflow() {
      const viewport = listViewportRef.current
      const content = listContentRef.current

      if (!viewport || !content || expanded) return

      setHasOverflow(content.scrollHeight > viewport.clientHeight + 1)
    }

    updateOverflow()

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateOverflow)
    if (listViewportRef.current) resizeObserver?.observe(listViewportRef.current)
    if (listContentRef.current) resizeObserver?.observe(listContentRef.current)
    window.addEventListener('resize', updateOverflow)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateOverflow)
    }
  }, [activities.length, expanded])

  function toggleExpanded() {
    const shouldExpand = !expanded
    setExpanded(shouldExpand)

    if (shouldExpand && isMobile) {
      window.setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 0)
    }
  }

  return (
    <Box sx={{ position: 'relative', minHeight: 148, height: { lg: '100%' } }}>
      <Paper
        ref={panelRef}
        component="section"
        elevation={0}
        sx={{
          ...panelSx,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          p: { xs: 2, md: 2.5 },
        }}
      >
        <Typography
          component="h2"
          sx={{ mb: 1.35, fontSize: 16, fontWeight: 800, textAlign: 'center' }}
        >
          {t('activitiesTitle')}
        </Typography>
        <Box
          ref={listViewportRef}
          sx={{
            display: 'flex',
            minHeight: 0,
            flex: 1,
            flexDirection: 'column',
            p: 1,
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.app,
            overflowY: expanded ? 'auto' : 'hidden',
          }}
        >
          {activities.length > 0 ? (
            <Stack ref={listContentRef} spacing={1.25}>
              {activities.map((activity) => (
                <Stack
                  key={activity.key}
                  direction="row"
                  spacing={1.4}
                  sx={{
                    px: 1.45,
                    py: 1.55,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: `${radius.sm}px`,
                    bgcolor: surface.paper,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 34,
                      height: 34,
                      flexShrink: 0,
                      bgcolor: surface.app,
                      color: brand.neutral[500],
                    }}
                  >
                    <HistoryRoundedIcon sx={{ fontSize: iconSize.sm }} />
                  </Avatar>
                  <Box
                    sx={{
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" gap={1}>
                      <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                        {activity.title}
                      </Typography>
                      <Chip
                        component="time"
                        dateTime={activity.occurredAt}
                        label={formatRelativeDate(activity.occurredAt)}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, flexShrink: 0, fontSize: 11, fontWeight: 700 }}
                      />
                    </Stack>
                    <Typography color="text.secondary" sx={{ mt: 0.25, fontSize: 11.5 }}>
                      {activity.detail}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={1}
              sx={{
                minHeight: 86,
                p: 2,
                borderRadius: `${radius.sm}px`,
              }}
            >
              <HistoryRoundedIcon sx={{ color: 'text.disabled' }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{t('activitiesEmpty')}</Typography>
            </Stack>
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: canExpand ? 1 : 0 }}>
          {canExpand && (
            <Button
              variant="outlined"
              size="small"
              aria-expanded={expanded}
              onClick={toggleExpanded}
              sx={{
                mr: 1.2,
                minHeight: 26,
                px: 1.1,
                py: 0,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {expanded ? t('activitiesViewLess') : t('activitiesViewMore')}
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  )
}
