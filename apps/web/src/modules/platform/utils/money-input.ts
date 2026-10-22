// Separators of the locale's money format. es-ES does not group 4-digit numbers, so the group
// separator is read from a 5-digit one (getNumberSeparators would fall back to ',', the decimal).
function getMoneySeparators(locale: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
  const group = parts.find((part) => part.type === 'group')?.value ?? ''
  const decimal = parts.find((part) => part.type === 'decimal')?.value ?? '.'

  return { group, decimal }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Money typed with cents in the locale's format ("1.234,56" in pt-BR, "1,234.56" in en-US).
// Without the locale's decimal separator, a final '.' or ',' followed by one or two digits is
// read as the cents ("49.99" in pt-BR is 49.99, not 4999): a group separator always has three.
// Returns null when the text is not a valid amount with at most two decimals.
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
