import type { InputHTMLAttributes } from 'react'
import type { FieldPath, FieldValues, UseControllerProps } from 'react-hook-form'
import type { TextFieldProps } from '@mui/material'
import type { ReactElementProps } from 'react-imask'

/** Digits only: whole numbers with `scale: 0`, decimals with a comma or dot otherwise. */
export interface NumberInputMask {
  mask: NumberConstructor
  scale: number
  min?: number
  max?: number
}

export type InputMask = string | Array<{ mask: string }> | NumberInputMask

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

export type MoneyInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'name' | 'value'
> & {
  value?: number | string
  name: string
  onChange: (event: { target: { name: string; value: string } }) => void
}

export type RhfMoneyFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = UseControllerProps<TFieldValues, TName> &
  Omit<TextFieldProps, 'name' | 'defaultValue' | 'value' | 'disabled' | 'type'> & {
    disabled?: boolean
  }

export type RhfTextFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = UseControllerProps<TFieldValues, TName> &
  Omit<TextFieldProps, 'name' | 'defaultValue' | 'value' | 'disabled'> & {
    disabled?: boolean
  }
