import type { FieldPath, FieldValues, UseControllerProps } from 'react-hook-form'
import type { TextFieldProps } from '@mui/material'
import type { ReactElementProps } from 'react-imask'

export type InputMask = string | Array<{ mask: string }>

export type SchemaMessageTranslator<Key extends string = string> = (key: Key) => string

export type MaskedInputProps = Omit<
  ReactElementProps<HTMLInputElement>,
  'onChange' | 'name' | 'ref'
> & {
  mask: InputMask
  value?: string
  name: string
  onChange: (event: { target: { name: string; value: string } }) => void
}

export type RhfMaskedTextFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = UseControllerProps<TFieldValues, TName> &
  Omit<TextFieldProps, 'name' | 'defaultValue' | 'value' | 'disabled'> & {
    disabled?: boolean
    mask: InputMask
  }

export type RhfTextFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = UseControllerProps<TFieldValues, TName> &
  Omit<TextFieldProps, 'name' | 'defaultValue' | 'value' | 'disabled'> & {
    disabled?: boolean
  }
