function getMoneySeparators(locale: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
  const group = parts.find((part) => part.type === 'group')?.value ?? ''
  const decimal = parts.find((part) => part.type === 'decimal')?.value ?? '.'

  return { group, decimal }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function parseMoneyInput(value: string, locale: string): number | null {
  const { group, decimal } = getMoneySeparators(locale)
  let text = value.trim()
  if (!text.includes(decimal)) text = text.replace(/[.,](\d{1,2})$/, `${decimal}$1`)

  const [integerPart = '', fraction, ...rest] = text.split(decimal)
  if (rest.length > 0) return null

  const grouped = group
    ? new RegExp(`^\\d{1,3}(${escapeRegExp(group)}\\d{3})+$`).test(integerPart)
    : false
  if (!/^\d+$/.test(integerPart) && !grouped) return null
  if (fraction !== undefined && !/^\d{1,2}$/.test(fraction)) return null

  const digits = group ? integerPart.split(group).join('') : integerPart
  return Number(fraction === undefined ? digits : `${digits}.${fraction}`)
}

export function formatMoneyInput(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
