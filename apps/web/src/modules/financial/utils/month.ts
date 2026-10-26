export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function recentMonths(reference: Date, count: number): string[] {
  return Array.from({ length: count }, (_, index) =>
    monthKey(new Date(reference.getFullYear(), reference.getMonth() - index, 1)),
  )
}

export function monthDate(month: string): Date {
  return new Date(`${month}-01T12:00:00Z`)
}

export function calendarDate(value: string): Date {
  return new Date(`${value.slice(0, 10)}T12:00:00Z`)
}
