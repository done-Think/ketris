export function crmChangedFields<T extends object>(current: T, changes: Partial<T>): string[] {
  return Object.entries(changes)
    .filter(
      ([key, value]) =>
        value !== undefined && JSON.stringify(current[key as keyof T]) !== JSON.stringify(value),
    )
    .map(([key]) => key)
}
