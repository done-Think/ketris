import type { TranslationKey } from '@/i18n/types/messages.types'
import { formatContractOption } from './contract-option-message'
import type {
  ContractFieldConfig,
  ContractFieldLabelKey,
  ContractFieldMeta,
} from '../types/contract'

export function toFieldConfig<LabelKey extends ContractFieldLabelKey>(
  meta: ContractFieldMeta<LabelKey>,
  t: (key: `fields.${LabelKey}`) => string,
  multiline?: boolean,
  optionTranslations?: (key: TranslationKey<'contracts.wizard.conditions'>) => string,
): ContractFieldConfig {
  return {
    name: meta.name,
    label: t(`fields.${meta.labelKey}`),
    mask: meta.mask,
    options: meta.options,
    getOptionLabel:
      meta.optionsNamespace && optionTranslations
        ? (option) => formatContractOption(meta.optionsNamespace, option, optionTranslations)
        : undefined,
    multiline,
  }
}

export function makePartyFieldsMeta(
  prefix: 'owner' | 'tenant' | 'guarantor',
): ContractFieldMeta<TranslationKey<'contracts.wizard.parties.fields'>>[] {
  return [
    { name: `${prefix}Name`, labelKey: 'fullName' },
    { name: `${prefix}Cpf`, labelKey: 'cpf', mask: '000.000.000-00' },
    { name: `${prefix}Email`, labelKey: 'email' },
    { name: `${prefix}Phone`, labelKey: 'phone', mask: '(00) 00000-0000' },
  ]
}
