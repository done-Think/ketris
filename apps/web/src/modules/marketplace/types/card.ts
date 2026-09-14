import type { SvgIconComponent } from '@mui/icons-material'

export type DirectoryCardMetric = {
  icon?: SvgIconComponent
  label: string
  showTooltip?: boolean
  value: number | string
}

export type DirectoryCardMetricsProps = {
  gridTemplateColumns: string | Record<string, string>
  labelFontWeight: number
  metrics: DirectoryCardMetric[]
  valueFontWeight: number
}
