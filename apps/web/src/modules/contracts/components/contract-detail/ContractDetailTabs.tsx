'use client'

import { Tab, Tabs } from '@mui/material'
import { useTranslations } from 'next-intl'

import { styles } from '../../styles/contract-detail-tabs.styles'
import type { ContractDetailTabsProps } from '../../types/detail'

export function ContractDetailTabs({ value, tabs, disabled, onChange }: ContractDetailTabsProps) {
  const t = useTranslations('contracts.detail.tabs')
  return (
    <Tabs
      value={value}
      onChange={(_event, tab) => onChange(tab)}
      variant="scrollable"
      scrollButtons={false}
      aria-label={t('label')}
      sx={styles.tabs}
    >
      {tabs.map((tab) => (
        <Tab key={tab} value={tab} label={t(tab)} disabled={disabled && tab !== value} />
      ))}
    </Tabs>
  )
}
