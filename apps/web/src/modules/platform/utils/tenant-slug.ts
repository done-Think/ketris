import { buildPublicProfileSlug } from '@shared/utils/public-profile-slug'

export function slugifyTenantName(value: string): string {
  return buildPublicProfileSlug(value)
}
