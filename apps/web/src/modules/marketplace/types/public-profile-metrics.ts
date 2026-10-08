import type { SvgIconComponent } from '@mui/icons-material'

export type PublicProfileMetric = {
  label: string
  value: string | number
  icon?: SvgIconComponent
}

export type PublicProfileMetricsProps = {
  accentColor: string
  metrics: PublicProfileMetric[]
}
