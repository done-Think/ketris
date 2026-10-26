import { contractOptionMessageKeys } from '../config/contract-labels'
import { dashboardFilterSelectSx, styles } from '../styles/contracts-filters.styles'
import { MenuItem, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useWatch } from 'react-hook-form'
import { DashboardStatusFilterButton } from '@shared/components/layout'
import { contractFilterTabs, contractTypeFilterOptions } from '../config/contract-ui'
import type { ContractsFiltersFormValues, ContractsFiltersProps } from '../types/contract'

export function ContractsFilters({ control, filterCounts, setValue }: ContractsFiltersProps) {
  const t = useTranslations('contracts.filters.tabs')
  const tType = useTranslations('contracts.filters.typeFilter')
  const status = useWatch({ control, name: 'status' })
  const period = useWatch({ control, name: 'period' })
  const type = useWatch({ control, name: 'type' })
  const activeTabValue =
    contractFilterTabs.find((tab) => tab.status === status && tab.period === period)?.label ??
    contractFilterTabs[0].label

  return (
    <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={styles.stack}>
      <TextField
        select
        size="small"
        value={activeTabValue}
        onChange={(event) => {
          const selectedTab = contractFilterTabs.find((tab) => tab.label === event.target.value)

          if (selectedTab) {
            setValue('status', selectedTab.status, { shouldDirty: true })
            setValue('period', selectedTab.period, { shouldDirty: true })
            setValue('type', 'ALL', { shouldDirty: true })
          }
        }}
        sx={dashboardFilterSelectSx}
      >
        {contractFilterTabs.map((tab) => (
          <MenuItem key={tab.label} value={tab.label}>
            {t(tab.label)}
          </MenuItem>
        ))}
      </TextField>

      {contractFilterTabs.map((tab) => {
        const active = tab.status === status && tab.period === period

        return (
          <DashboardStatusFilterButton
            key={tab.label}
            active={active}
            count={filterCounts[tab.label]}
            onClick={() => {
              setValue('status', tab.status, { shouldDirty: true })
              setValue('period', tab.period, { shouldDirty: true })
              setValue('type', 'ALL', { shouldDirty: true })
            }}
            sx={styles.dashboardStatusFilterButton}
          >
            {t(tab.label)}
          </DashboardStatusFilterButton>
        )
      })}

      <TextField
        select
        size="small"
        value={type}
        onChange={(event) =>
          setValue('type', event.target.value as ContractsFiltersFormValues['type'], {
            shouldDirty: true,
          })
        }
        sx={styles.textField}
        SelectProps={{
          inputProps: { 'aria-label': tType('label') },
        }}
      >
        {contractTypeFilterOptions.map((option) => (
          <MenuItem key={option} value={option}>
            {tType(
              option === 'ALL' ? 'ALL' : contractOptionMessageKeys.contractTypeOptions[option],
            )}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  )
}
