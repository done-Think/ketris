import { contractOptionMessage } from './contract-option-message'
import type { ContractFieldConfig, ContractFieldMeta } from '../types/contract'

export function toFieldConfig(
  meta: ContractFieldMeta,
  t: (key: string) => string,
  multiline?: boolean,
): ContractFieldConfig {
  return {
    name: meta.name,
    label: t(`fields.${meta.labelKey}`),
    mask: meta.mask,
    options: meta.options,
    getOptionLabel: meta.optionsNamespace
      ? (option) => t(contractOptionMessage(meta.optionsNamespace, option))
      : undefined,
    multiline,
  }
}

export function makePartyFieldsMeta(prefix: 'owner' | 'tenant' | 'guarantor'): ContractFieldMeta[] {
  return [
    { name: `${prefix}Name`, labelKey: 'fullName' },
    { name: `${prefix}Cpf`, labelKey: 'cpf', mask: '000.000.000-00' },
    { name: `${prefix}Email`, labelKey: 'email' },
    { name: `${prefix}Phone`, labelKey: 'phone', mask: '(00) 00000-0000' },
  ]
}
