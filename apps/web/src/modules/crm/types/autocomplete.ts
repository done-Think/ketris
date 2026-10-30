import type { z } from 'zod'
import type { contactSelectionSchema } from '../schemas/contact-selection-schema'
export type CrmContactOption = z.infer<typeof contactSelectionSchema>
export interface ContactPickerProps {
  value: { id: string; name: string } | null
  onChange: (value: { id: string; name: string } | null) => void
  label: string
  error?: boolean
  helperText?: string
}
export interface CrmAutocompleteProps<T extends { id: string }> {
  value: T | null
  options: T[]
  onChange: (value: T | null) => void
  onSearch: (value: string) => void
  getOptionLabel: (value: T) => string
  label: string
  required?: boolean
  loading: boolean
  loadError?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore: () => void
  onRetry: () => void
  error?: boolean
  helperText?: string
}
export interface CrmContactAutocompleteProps {
  value: CrmContactOption | null
  onChange: (value: CrmContactOption | null) => void
  error?: boolean
  helperText?: string
}
