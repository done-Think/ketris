export function computeNextDueDate(dueDay: number, from: Date): Date {
  const clampToMonth = (year: number, month: number) => {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
    return new Date(year, month, Math.min(dueDay, lastDayOfMonth))
  }

  const candidate = clampToMonth(from.getFullYear(), from.getMonth())

  return candidate >= from ? candidate : clampToMonth(from.getFullYear(), from.getMonth() + 1)
}
