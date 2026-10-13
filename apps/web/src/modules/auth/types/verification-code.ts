import type { Control, FieldValues, Path } from 'react-hook-form'

export type VerificationCodeFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>
  name: Path<TFieldValues>
  label: string
  disabled?: boolean
}
