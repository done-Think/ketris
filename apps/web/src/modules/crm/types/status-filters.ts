export interface CrmStatusFiltersProps<T extends string> {
  value: T
  options: readonly { value: T; label: string }[]
  counts: Partial<Record<T, number>>
  ariaLabel: string
  onChange: (value: T) => void
}
export interface CrmFilterOptionLabelProps {
  active: boolean
  count: number
  label: string
}
