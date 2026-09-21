const relativeTimeFormatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

export function formatLeadRelativeDate(value: string): string {
  const target = new Date(value)
  const differenceInSeconds = Math.round((target.getTime() - Date.now()) / 1000)
  const absoluteSeconds = Math.abs(differenceInSeconds)

  if (absoluteSeconds < 60) {
    return 'agora'
  }

  const units = [
    { unit: 'year', seconds: 31_536_000 },
    { unit: 'month', seconds: 2_592_000 },
    { unit: 'day', seconds: 86_400 },
    { unit: 'hour', seconds: 3_600 },
    { unit: 'minute', seconds: 60 },
  ] as const

  const selected = units.find(({ seconds }) => absoluteSeconds >= seconds) ?? units.at(-1)!
  const amount = Math.round(differenceInSeconds / selected.seconds)

  return relativeTimeFormatter.format(amount, selected.unit)
}
