function normalizeToSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildPublicProfileSlug(value: string | null | undefined) {
  return normalizeToSlug(value?.trim() ?? '')
}

export function buildCreciNumberSlug(value: string | null | undefined) {
  return value?.replace(/\D/g, '') ?? ''
}

export function buildAgencyPublicProfileHref(
  name: string,
  legalCreci: string | null | undefined,
  fallbackId: string,
) {
  const nameSlug = buildPublicProfileSlug(name)
  const creciSlug = buildCreciNumberSlug(legalCreci)

  if (!nameSlug || !creciSlug) return `/agencies/${fallbackId}`

  return `/agencies/${nameSlug}/${creciSlug}`
}
