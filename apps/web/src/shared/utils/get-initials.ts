export function getInitials(name?: string | null): string {
  if (!name) return 'K'

  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
}
