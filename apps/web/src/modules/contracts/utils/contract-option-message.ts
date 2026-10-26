import { contractOptionMessageKeys } from '../config/contract-labels'

export function contractOptionMessage(namespace: string | undefined, option: string) {
  if (!namespace) return option
  return namespace + '.' + (contractOptionMessageKeys[namespace]?.[option] ?? option)
}
