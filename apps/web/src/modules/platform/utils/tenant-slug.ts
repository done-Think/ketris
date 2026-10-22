import { buildPublicProfileSlug } from '@shared/utils/public-profile-slug'

// Suggests a tenant slug from its name: "Imobiliária São João" → "imobiliaria-sao-joao".
// Same rule (shared function) as the server-side slug of self-registered agencies.
export function slugifyTenantName(value: string): string {
  return buildPublicProfileSlug(value)
}
