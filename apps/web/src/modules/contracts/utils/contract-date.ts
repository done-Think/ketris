export function parseContractFormDate(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (!match) return null
  const [, day, month, year] = match
  const date = new Date(year + '-' + month + '-' + day + 'T00:00:00.000Z')
  if (
    !Number.isFinite(date.getTime()) ||
    date.getUTCDate() !== Number(day) ||
    date.getUTCMonth() + 1 !== Number(month) ||
    date.getUTCFullYear() !== Number(year)
  )
    return null
  return date
}

export function contractIsoDateToForm(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-')
  return day + '/' + month + '/' + year
}
