import type { TranslationKey } from '@/i18n/types/messages.types'
import { contractOptionMessageKeys } from '../config/contract-labels'

const messages = new Map(
  Object.entries(contractOptionMessageKeys).map(([namespace, options]) => [
    namespace,
    new Map(Object.entries(options)),
  ]),
)

export function formatContractOption(
  namespace: string | undefined,
  option: string,
  translate: (key: TranslationKey<'contracts.wizard.conditions'>) => string,
) {
  const key = namespace ? messages.get(namespace)?.get(option) : undefined
  return key ? translate(key) : option
}
