'use client'

import { Box, Tab, Tabs } from '@mui/material'
import { useTranslations } from 'next-intl'
import { type MouseEvent, useState } from 'react'

import { getPreviewPanelStyles, styles } from '../../styles/agency-brand-editor.styles'
import type {
  AgencyBrandPreviewProps,
  AgencyBrandPreviewTab,
} from '../../types/agency-brand-editor'
import { AgencyCard } from '../AgencyCard'
import { AgencyHighlightedTeam } from '../profile/AgencyHighlightedTeam'
import { AgencyProfileHero } from '../profile/AgencyProfileHero'

function preventNavigation(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
}

export function AgencyBrandPreview({ agency, highlightedColor }: AgencyBrandPreviewProps) {
  const t = useTranslations('marketplace.agencyProfileEditor.brand')
  const [tab, setTab] = useState<AgencyBrandPreviewTab>('profile')

  return (
    <>
      <Tabs value={tab} onChange={(_event, value: AgencyBrandPreviewTab) => setTab(value)}>
        <Tab value="profile" label={t('previewTabs.profile')} />
        <Tab value="card" label={t('previewTabs.card')} />
      </Tabs>
      {tab === 'profile' ? (
        <Box
          sx={getPreviewPanelStyles(styles.previewProfile, highlightedColor)}
          onClickCapture={preventNavigation}
        >
          <AgencyProfileHero agency={agency} />
          <AgencyHighlightedTeam brand={agency.brand} team={agency.teamHighlights} />
        </Box>
      ) : (
        <Box
          sx={getPreviewPanelStyles(styles.previewCards, highlightedColor)}
          onClickCapture={preventNavigation}
        >
          <AgencyCard {...agency} viewMode="grid" />
          <Box sx={styles.previewCardList}>
            <AgencyCard {...agency} viewMode="list" />
          </Box>
        </Box>
      )}
    </>
  )
}
